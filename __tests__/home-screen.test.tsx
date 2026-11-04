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
}));

import HomeScreen from '../src/Screen/HomeScreen';
import {
  subscribeToConversations,
  subscribeToUsers,
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
});
