import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { View } from 'react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../src/context/AuthContext', () => {
  const user = { uid: 'current-user' };
  return { useAuth: () => ({ user }) };
});

jest.mock('../src/services/chatService', () => ({
  subscribeToConversations: jest.fn(),
  subscribeToUsers: jest.fn(),
  subscribeToLastMessage: jest.fn(),
  subscribeToMessages: jest.fn(() => jest.fn()),
}));

import HomeScreen from '../src/Screen/HomeScreen';
import {
  subscribeToConversations,
  subscribeToUsers,
  subscribeToMessages,
} from '../src/services/chatService';

const mockSubscribeToConversations = subscribeToConversations as jest.Mock;
const mockSubscribeToUsers = subscribeToUsers as jest.Mock;

function arrangeHome(unreadCount: number) {
  mockSubscribeToConversations.mockImplementation((_uid, callback) => {
    callback([{
      chatId: 'current-user_friend',
      partnerId: 'friend',
      lastMessage: 'Tin nhắn mới',
      lastMessageType: 'text',
      lastMessageAt: 123456,
      unreadCount,
    }]);
    return jest.fn();
  });
  mockSubscribeToUsers.mockImplementation(callback => {
    callback([{
      uid: 'friend',
      displayName: 'Bạn chat',
      email: 'friend@example.com',
      avatarColor: '#1890ff',
      online: true,
      lastSeen: 123456,
    }]);
    return jest.fn();
  });
}

describe('Home unread indicator', () => {
  beforeEach(() => jest.clearAllMocks());

  test('shows one accessible blue dot for an unread conversation', async () => {
    arrangeHome(3);
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    const unreadDots = renderer.root.findAll(
      node => node.type === View && node.props.testID === 'unread-dot',
    );
    expect(unreadDots).toHaveLength(1);
    expect(unreadDots[0].props)
      .toMatchObject({ accessibilityLabel: 'Có tin nhắn chưa đọc' });
    await ReactTestRenderer.act(() => renderer.unmount());
  });

  test('does not show the blue dot after the conversation is read', async () => {
    arrangeHome(0);
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    expect(renderer.root.findAll(
      node => node.type === View && node.props.testID === 'unread-dot',
    )).toHaveLength(0);
    await ReactTestRenderer.act(() => renderer.unmount());
  });

  test('shows a group alongside personal chats and its image preview', async () => {
    mockSubscribeToConversations.mockImplementation((_uid, callback) => {
      callback([{ chatId: 'group-1', kind: 'group', groupName: 'Nhóm học', lastMessage: '', lastMessageType: 'image', lastMessageAt: 10, unreadCount: 2 }]);
      return jest.fn();
    });
    mockSubscribeToUsers.mockImplementation(callback => { callback([]); return jest.fn(); });
    const renderer = ReactTestRenderer.create(<HomeScreen />);
    await ReactTestRenderer.act(async () => {});
    const text = renderer.root.findAll(node => typeof node.props.children === 'string').map(node => node.props.children);
    expect(text).toContain('Nhóm học');
    expect(text).toContain('📷 Hình ảnh');
    await ReactTestRenderer.act(() => renderer.unmount());
  });

  test('updates the preview when the latest legacy message is recalled', async () => {
    arrangeHome(0);
    (subscribeToMessages as jest.Mock).mockImplementation((_id, callback) => {
      callback([{ id: 'last', senderId: 'friend', type: 'text', text: 'Nội dung cũ', createdAt: 123456, recalled: true }]);
      return jest.fn();
    });
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => { renderer = ReactTestRenderer.create(<HomeScreen />); });
    const text = renderer.root.findAll(node => node.props.children === 'Tin nhắn đã được thu hồi');
    expect(text.length).toBeGreaterThan(0);
    await ReactTestRenderer.act(() => renderer.unmount());
  });

  test('recovers the contact name from a legacy direct chat id without partnerId', async () => {
    mockSubscribeToConversations.mockImplementation((_uid, callback) => {
      callback([{ chatId: 'current-user_friend', lastMessage: 'Chào', lastMessageType: 'text', lastMessageAt: 10, unreadCount: 0 }]);
      return jest.fn();
    });
    mockSubscribeToUsers.mockImplementation(callback => {
      callback([{ uid: 'friend', displayName: 'Bạn cũ', avatarColor: '#1890ff', online: false, lastSeen: 1 }]);
      return jest.fn();
    });
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => { renderer = ReactTestRenderer.create(<HomeScreen />); });
    expect(renderer.root.findAll(node => node.props.children === 'Bạn cũ').length).toBeGreaterThan(0);
    await ReactTestRenderer.act(() => renderer.unmount());
  });

  test('labels a missing profile without putting its UID below the name', async () => {
    (subscribeToMessages as jest.Mock).mockImplementation(() => jest.fn());
    mockSubscribeToConversations.mockImplementation((_uid, callback) => {
      callback([{ chatId: 'current-user_unknown', partnerId: 'unknown', lastMessage: '', lastMessageType: 'text', lastMessageAt: 10, unreadCount: 0 }]);
      return jest.fn();
    });
    mockSubscribeToUsers.mockImplementation(callback => { callback([]); return jest.fn(); });
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => { renderer = ReactTestRenderer.create(<HomeScreen />); });
    expect(renderer.root.findAll(node => node.props.children === 'Tài khoản không có hồ sơ').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'UID: unknown')).toHaveLength(0);
    expect(renderer.root.findAll(node => node.props.children === 'Chưa có tin nhắn').length).toBeGreaterThan(0);
    await ReactTestRenderer.act(() => renderer.unmount());
  });

  test('shows only the latest message beneath duplicate names and keeps presence dots', async () => {
    (subscribeToMessages as jest.Mock).mockImplementation(() => jest.fn());
    mockSubscribeToConversations.mockImplementation((_uid, callback) => {
      callback([
        { chatId: 'current-user_a', partnerId: 'a', lastMessage: 'Tin A', lastMessageType: 'text', lastMessageAt: 20, unreadCount: 0 },
        { chatId: 'current-user_b', partnerId: 'b', lastMessage: 'Tin B', lastMessageType: 'text', lastMessageAt: 10, unreadCount: 0 },
      ]);
      return jest.fn();
    });
    mockSubscribeToUsers.mockImplementation(callback => {
      callback([
        { uid: 'a', displayName: 'Hung', email: 'hung1@example.com', online: true, avatarColor: '#1890ff', lastSeen: 1 },
        { uid: 'b', displayName: 'Hung', email: 'hung2@example.com', online: false, avatarColor: '#1890ff', lastSeen: 1 },
      ]);
      return jest.fn();
    });
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => { renderer = ReactTestRenderer.create(<HomeScreen />); });
    const contents = renderer.root.findAll(node => typeof node.props.children === 'string').map(node => node.props.children);
    expect(contents).toContain('Tin A');
    expect(contents).toContain('Tin B');
    expect(contents).not.toContain('hung1@example.com');
    expect(contents).not.toContain('hung2@example.com');
    expect(contents).not.toContain('● Đang hoạt động');
    expect(contents).not.toContain('● Không hoạt động');
    const presenceDots = renderer.root.findAll(node => node.type === View && node.props.testID === 'presence-dot');
    expect(presenceDots).toHaveLength(2);
    expect(presenceDots[0].props.accessibilityLabel).toBe('Đang hoạt động');
    expect(presenceDots[1].props.accessibilityLabel).toBe('Không hoạt động');
    await ReactTestRenderer.act(() => renderer.unmount());
  });
});
