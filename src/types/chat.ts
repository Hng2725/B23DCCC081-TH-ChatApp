import type { User } from 'firebase/auth';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  avatarColor: string;
  online: boolean;
  lastSeen: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  type: 'text' | 'location' | 'image';
  text: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
  recalled?: boolean;
  recalledAt?: number;
  reactions?: Record<string, string>;
};

export type ConversationSummary = {
  chatId: string;
  kind?: 'direct' | 'group';
  partnerId?: string;
  groupName?: string;
  lastMessageId?: string;
  lastMessage: string;
  lastMessageType: ChatMessage['type'];
  lastMessageAt: number;
  unreadCount: number;
};

export type Conversation = {
  kind: 'direct' | 'group';
  name?: string;
  createdBy?: string;
  createdAt?: number;
  members: Record<string, boolean>;
};

export type ChatNotification = {
  id: string;
  type: 'message' | 'group_invite' | 'reaction';
  chatId: string;
  actorId: string;
  messageId?: string;
  createdAt: number;
  readAt?: number;
};

export type AppUser = User;
