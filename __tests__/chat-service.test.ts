jest.mock('../src/services/firebase', () => ({ database: {} }));
jest.mock('firebase/database', () => ({
  get: jest.fn(), onValue: jest.fn(), push: jest.fn(() => ({ key: 'm1' })),
  ref: jest.fn((_database: unknown, path = '') => path),
  increment: jest.fn((value: number) => ({ increment: value })),
  serverTimestamp: jest.fn(() => 100), set: jest.fn(), update: jest.fn(),
}));
import * as db from 'firebase/database';
import { sendTextMessage, subscribeToUsers } from '../src/services/chatService';

const mockGet = db.get as jest.Mock;
const mockUpdate = db.update as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockImplementation((path: string) => Promise.resolve({ val: () =>
    path === 'conversations/recipient_sender' ? { members: { sender: true, recipient: true } }
      : path.endsWith('/members') ? { sender: true, recipient: true } : null,
  }));
  mockUpdate.mockResolvedValue(undefined);
});

test('initializes a direct chat and writes its message and previews atomically', async () => {
  await expect(sendTextMessage('sender', 'recipient', 'Xin chào')).resolves.toBe(true);
  expect(mockUpdate).not.toHaveBeenCalledWith('conversations/recipient_sender/members', expect.anything());
  expect(mockUpdate).toHaveBeenCalledWith('', expect.objectContaining({
    'conversations/recipient_sender/messages/m1': expect.objectContaining({ senderId: 'sender', text: 'Xin chào' }),
    'userConversations/recipient/recipient_sender/unreadCount': { increment: 1 },
  }));
  expect(db.set).toHaveBeenCalledWith('notifications/recipient/recipient_sender_m1', expect.objectContaining({
    type: 'message', actorId: 'sender', messageId: 'm1',
  }));
});

test('creates direct membership only when the chat cannot yet be read', async () => {
  mockGet.mockRejectedValueOnce(Object.assign(new Error('permission_denied'), { code: 'PERMISSION_DENIED' }));
  await expect(sendTextMessage('sender', 'recipient', 'Tin đầu')).resolves.toBe(true);
  expect(db.set).toHaveBeenCalledWith('conversations/recipient_sender', expect.objectContaining({
    members: { sender: true, recipient: true },
    metadata: { kind: 'direct', memberA: 'recipient', memberB: 'sender' },
  }));
});

test('rejects a direct chat that has an unexpected third member', async () => {
  mockGet.mockImplementation((path: string) => Promise.resolve({ val: () =>
    path.endsWith('/members') ? { sender: true, recipient: true, outsider: true } : null,
  }));
  await expect(sendTextMessage('sender', 'recipient', 'Bí mật')).rejects.toThrow();
  expect(mockUpdate).not.toHaveBeenCalled();
});

test('does not claim the send succeeded if the atomic write fails', async () => {
  mockUpdate.mockImplementation((path: string) => path === '' ? Promise.reject(new Error('permission_denied')) : Promise.resolve());
  await expect(sendTextMessage('sender', 'recipient', 'Xin chào')).rejects.toThrow('permission_denied');
  expect(db.set).not.toHaveBeenCalled();
});

test('does not create a message for empty text', async () => {
  await expect(sendTextMessage('sender', 'recipient', '  ')).resolves.toBe(false);
  expect(mockUpdate).not.toHaveBeenCalled();
});

test('contact online status follows live presence instead of stale profile online', () => {
  const handlers: Record<string, (snapshot: { val: () => unknown }) => void> = {};
  (db.onValue as jest.Mock).mockImplementation((path: string, callback) => { handlers[path] = callback; return jest.fn(); });
  const callback = jest.fn();
  subscribeToUsers(callback);
  handlers.users({ val: () => ({ friend: { uid: 'friend', displayName: 'Bạn', online: false, lastSeen: 1 } }) });
  handlers.presence({ val: () => ({ friend: { sessions: { device1: true }, lastSeen: 2 } }) });
  expect(callback).toHaveBeenLastCalledWith([expect.objectContaining({ uid: 'friend', online: true, lastSeen: 2 })]);
});

test('a stale profile online flag does not mark a contact as active', () => {
  const handlers: Record<string, (snapshot: { val: () => unknown }) => void> = {};
  (db.onValue as jest.Mock).mockImplementation((path: string, callback) => { handlers[path] = callback; return jest.fn(); });
  const callback = jest.fn();
  subscribeToUsers(callback);
  handlers.users({ val: () => ({ friend: { uid: 'friend', displayName: 'Bạn', online: true, lastSeen: 1 } }) });
  handlers.presence({ val: () => ({}) });
  expect(callback).toHaveBeenLastCalledWith([expect.objectContaining({ uid: 'friend', online: false })]);
});
