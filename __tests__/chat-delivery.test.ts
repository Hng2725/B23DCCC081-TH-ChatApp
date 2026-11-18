jest.mock('../src/services/firebase', () => ({ database: {} }));
jest.mock('firebase/database', () => ({
  get: jest.fn(), onValue: jest.fn(), push: jest.fn(() => ({ key: 'm1' })),
  ref: jest.fn((_db: unknown, path = '') => path), serverTimestamp: jest.fn(() => 500),
  increment: jest.fn((count: number) => ({ increment: count })),
  set: jest.fn(), update: jest.fn(),
}));

import * as db from 'firebase/database';
import { sendChatTextMessage } from '../src/services/chatService';

test('fans a group message and unread counts out to every other member', async () => {
  (db.get as jest.Mock).mockImplementation((path: string) => Promise.resolve({ val: () => path.endsWith('/members') ? { a: true, b: true, c: true } : path.endsWith('/metadata') ? { kind: 'group', name: 'Nhóm' } : null }));
  (db.update as jest.Mock).mockResolvedValue(undefined);
  await sendChatTextMessage('a', 'group-1', 'Xin chào');
  expect(db.update).toHaveBeenCalledWith('', expect.objectContaining({
    'conversations/group-1/messages/m1': expect.objectContaining({ text: 'Xin chào' }),
    'userConversations/b/group-1/unreadCount': { increment: 1 },
    'userConversations/c/group-1/unreadCount': { increment: 1 },
    'userConversations/a/group-1/unreadCount': 0,
  }));
});
