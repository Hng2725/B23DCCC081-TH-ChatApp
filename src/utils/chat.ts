export type MessageType = 'text' | 'location';

export type MessagePayload = {
  senderId: string;
  type: MessageType;
  text: string;
  latitude?: number;
  longitude?: number;
};

export type SortableConversation = {
  chatId: string;
  lastMessageAt: number;
};

export function createChatId(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join('_');
}

export function buildTextMessage(senderId: string, text: string): MessagePayload | null {
  const normalizedText = text.trim();
  if (!normalizedText) return null;

  return { senderId, type: 'text', text: normalizedText };
}

export function buildLocationMessage(senderId: string, latitude: number, longitude: number): MessagePayload {
  return {
    senderId,
    type: 'location',
    text: '📍 Vị trí đã chia sẻ',
    latitude,
    longitude,
  };
}

export function sortConversations<T extends SortableConversation>(conversations: T[]) {
  return [...conversations].sort((left, right) => right.lastMessageAt - left.lastMessageAt);
}

export function incrementUnreadCount(current: unknown) {
  return Number(current || 0) + 1;
}
