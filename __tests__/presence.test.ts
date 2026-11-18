jest.mock('../src/services/firebase', () => ({ database: {} }));
jest.mock('firebase/database', () => ({
  onDisconnect: jest.fn(() => ({ remove: jest.fn(() => Promise.resolve()), set: jest.fn(() => Promise.resolve()) })),
  onValue: jest.fn(() => jest.fn()),
  ref: jest.fn((_db: unknown, path: string) => path),
  remove: jest.fn(() => Promise.resolve()), serverTimestamp: jest.fn(() => 100), set: jest.fn(() => Promise.resolve()),
}));
import * as db from 'firebase/database';
import { AppState } from 'react-native';
import { clearPresence, enterChat, subscribeToPresence } from '../src/services/presenceService';

test('registers disconnect cleanup for a session before marking it online', async () => {
  Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
  subscribeToPresence('me');
  const connected = (db.onValue as jest.Mock).mock.calls[0][1];
  await connected({ val: () => true });
  await Promise.resolve();
  await Promise.resolve();
  expect(db.onDisconnect).toHaveBeenCalledWith(expect.stringMatching(/^presence\/me\/sessions\//));
  expect(db.set).toHaveBeenCalledWith(expect.stringMatching(/^presence\/me\/sessions\//), true);
});

test('removes active chat when the app moves to background', () => {
  jest.clearAllMocks();
  const appListener = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any);
  const leave = enterChat('me', 'chat');
  const onState = appListener.mock.calls[0]?.[1];
  expect(onState).toBeDefined();
  onState?.('background' as any);
  expect(db.remove).toHaveBeenCalledWith(expect.stringMatching(/^activeChats\/chat\/me\//));
  leave();
  appListener.mockRestore();
});

test('clears its session and records last seen before logout', async () => {
  jest.clearAllMocks();
  const appListener = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any);
  const leave = enterChat('me', 'logout-chat');
  await clearPresence('me');
  expect(db.remove).toHaveBeenCalledWith(expect.stringMatching(/^activeChats\/logout-chat\/me\//));
  expect(db.remove).toHaveBeenCalledWith(expect.stringMatching(/^typing\/logout-chat\/me\//));
  expect(db.remove).toHaveBeenCalledWith(expect.stringMatching(/^presence\/me\/sessions\//));
  expect(db.set).toHaveBeenCalledWith('presence/me/lastSeen', 100);
  leave();
  appListener.mockRestore();
});

test('does not restore online after presence cleanup races with connection setup', async () => {
  jest.clearAllMocks();
  Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
  const appListener = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  (db.onDisconnect as jest.Mock).mockImplementationOnce(() => ({ remove: () => gate }));
  const stop = subscribeToPresence('me');
  const connected = (db.onValue as jest.Mock).mock.calls[0][1];
  connected({ val: () => true });
  stop();
  release();
  await Promise.resolve();
  await Promise.resolve();
  expect((db.set as jest.Mock).mock.calls.some(([path]) => String(path).includes('/sessions/'))).toBe(false);
  appListener.mockRestore();
});
