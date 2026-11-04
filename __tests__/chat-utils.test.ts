import {
  buildLocationMessage,
  buildTextMessage,
  createChatId,
  incrementUnreadCount,
  sortConversations,
} from '../src/utils/chat';
import { validateLogin, validateRegistration } from '../src/utils/authValidation';
import Colors from '../src/theme/colors';

describe('chat helpers', () => {
  test('uses the app blue for unread message badges', () => {
    expect(Colors.unread).toBe('#1890ff');
  });

  test('creates the same chat id regardless of participant order', () => {
    expect(createChatId('z-user', 'a-user')).toBe('a-user_z-user');
    expect(createChatId('a-user', 'z-user')).toBe('a-user_z-user');
  });

  test('rejects whitespace-only text before building a message', () => {
    expect(buildTextMessage('sender', '   ')).toBeNull();
  });

  test('builds a location message with the Google Maps preview', () => {
    expect(buildLocationMessage('sender', 10.762622, 106.660172)).toMatchObject({
      senderId: 'sender',
      type: 'location',
      latitude: 10.762622,
      longitude: 106.660172,
      text: '📍 Vị trí đã chia sẻ',
    });
  });

  test('sorts newest conversations first', () => {
    expect(sortConversations([
      { chatId: 'old', lastMessageAt: 5 },
      { chatId: 'new', lastMessageAt: 10 },
    ]).map(item => item.chatId)).toEqual(['new', 'old']);
  });

  test('increments unread count from missing or existing values', () => {
    expect(incrementUnreadCount(undefined)).toBe(1);
    expect(incrementUnreadCount(4)).toBe(5);
  });
});

describe('authentication validation', () => {
  test('requires both login fields', () => {
    expect(validateLogin('', '')).toEqual({ email: 'Email không được để trống', password: 'Mật khẩu không được để trống' });
  });

  test('requires a six-character password and matching confirmation when registering', () => {
    expect(validateRegistration({ name: 'An', email: 'an@example.com', password: '12345', confirmPassword: '123456' }))
      .toMatchObject({ password: 'Mật khẩu phải có ít nhất 6 ký tự', confirmPassword: 'Mật khẩu xác nhận không khớp' });
  });
});
