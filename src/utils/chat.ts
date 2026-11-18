export type MessageType = 'text' | 'location' | 'image';

export type MessagePayload = {
  senderId: string;
  type: MessageType;
  text: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
};

export type SortableConversation = {
  chatId: string;
  lastMessageAt: number;
};

export function createChatId(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join('_');
}

export function partnerIdFromChatId(chatId: string, currentUserId: string) {
  if (chatId.startsWith(`${currentUserId}_`)) return chatId.slice(currentUserId.length + 1) || undefined;
  if (chatId.endsWith(`_${currentUserId}`)) return chatId.slice(0, -currentUserId.length - 1) || undefined;
  return undefined;
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

export function messagePreview(message: { type: MessageType; text: string; recalled?: boolean }) {
  if (message.recalled) return 'Tin nhắn đã được thu hồi';
  if (message.type === 'image') return '📷 Hình ảnh';
  if (message.type === 'location') return '📍 Vị trí';
  return message.text;
}

export function receiptForMessage(
  message: { senderId: string; createdAt: number },
  members: string[],
  readAt: Record<string, number>,
): { seen: boolean; seenAt?: number } {
  const others = members.filter(uid => uid !== message.senderId);
  if (!others.length || others.some(uid => !readAt[uid] || readAt[uid] < message.createdAt)) return { seen: false };
  return { seen: true, seenAt: Math.max(...others.map(uid => readAt[uid])) };
}

export function reactionCounts(reactions: Record<string, string> = {}): [string, number][] {
  const counts = new Map<string, number>();
  Object.values(reactions).forEach(emoji => counts.set(emoji, (counts.get(emoji) || 0) + 1));
  return [...counts.entries()];
}

export function validGroupMembers(currentUserId: string, selectedIds: string[]) {
  return new Set(selectedIds.filter(uid => uid !== currentUserId)).size >= 2;
}
