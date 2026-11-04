jest.mock('../src/services/firebase', () => ({ database: {} }));

jest.mock('firebase/database', () => ({
  get: jest.fn(),
  onValue: jest.fn(),
  push: jest.fn(() => ({ key: 'message-1' })),
  ref: jest.fn((_database: unknown, path: string) => path),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => 123456),
  set: jest.fn(),
  update: jest.fn(),
}));

import * as databaseApi from 'firebase/database';
import { sendTextMessage } from '../src/services/chatService';

const mockGet = databaseApi.get as jest.Mock;
const mockRunTransaction = databaseApi.runTransaction as jest.Mock;
const mockSet = databaseApi.set as jest.Mock;
const mockUpdate = databaseApi.update as jest.Mock;

describe('chat service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ exists: () => true });
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
  });

  test('reports a sent message as successful when only the recipient summary update fails', async () => {
    mockUpdate.mockImplementation((path: string) =>
      path.startsWith('userConversations/recipient/')
        ? Promise.reject(new Error('permission_denied'))
        : Promise.resolve(undefined),
    );

    await expect(sendTextMessage('sender', 'recipient', 'Xin chào')).resolves.toBe(true);
    expect(mockSet).toHaveBeenCalledWith(
      'conversations/recipient_sender/messages/message-1',
      expect.objectContaining({ senderId: 'sender', text: 'Xin chào' }),
    );
  });

  test('marks the recipient unread with a direct write that does not require read permission', async () => {
    mockRunTransaction.mockResolvedValue(undefined);

    await sendTextMessage('sender', 'recipient', 'New incoming message');

    expect(mockUpdate).toHaveBeenCalledWith(
      'userConversations/recipient/recipient_sender',
      expect.objectContaining({
        partnerId: 'sender',
        lastMessage: 'New incoming message',
        unreadCount: 1,
      }),
    );
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  test('creates conversation members only when the first message write is denied', async () => {
    mockRunTransaction.mockResolvedValue(undefined);
    mockSet
      .mockRejectedValueOnce(Object.assign(new Error('permission_denied'), { code: 'PERMISSION_DENIED' }))
      .mockResolvedValueOnce(undefined);

    await expect(sendTextMessage('sender', 'recipient', 'Tin mới')).resolves.toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledWith(
      'conversations/recipient_sender/members',
      { sender: true, recipient: true },
    );
  });
});
