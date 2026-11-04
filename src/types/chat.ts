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
  type: 'text' | 'location';
  text: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
};

export type ConversationSummary = {
  chatId: string;
  partnerId: string;
  lastMessage: string;
  lastMessageType: ChatMessage['type'];
  lastMessageAt: number;
  unreadCount: number;
};

export type AppUser = User;
