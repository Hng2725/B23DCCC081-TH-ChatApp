import { messagePreview, receiptForMessage, reactionCounts, validGroupMembers } from '../src/utils/chat';

describe('extended chat behavior', () => {
  test('shows recalled messages in Home instead of their original content', () => {
    expect(messagePreview({ type: 'image', text: '', recalled: true })).toBe('Tin nhắn đã được thu hồi');
    expect(messagePreview({ type: 'image', text: '' })).toBe('📷 Hình ảnh');
    expect(messagePreview({ type: 'location', text: '' })).toBe('📍 Vị trí');
  });

  test('group receipt waits for every other member and uses the last view time', () => {
    const message = { senderId: 'a', createdAt: 100 };
    expect(receiptForMessage(message, ['a', 'b', 'c'], { b: 130 })).toEqual({ seen: false });
    expect(receiptForMessage(message, ['a', 'b', 'c'], { b: 130, c: 150 })).toEqual({ seen: true, seenAt: 150 });
  });

  test('counts at most one reaction per person', () => {
    expect(reactionCounts({ a: '👍', b: '👍', c: '❤️' })).toEqual([['👍', 2], ['❤️', 1]]);
  });

  test('requires two other distinct users to create a group', () => {
    expect(validGroupMembers('me', ['me', 'a', 'a'])).toBe(false);
    expect(validGroupMembers('me', ['a', 'b'])).toBe(true);
  });
});
