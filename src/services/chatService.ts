import { get, increment, onValue, push, ref, serverTimestamp, set, update } from 'firebase/database';
import { database } from './firebase';
import type { ChatMessage, ChatNotification, Conversation, ConversationSummary, UserProfile } from '../types/chat';
import { buildLocationMessage, buildTextMessage, createChatId, messagePreview, type MessagePayload, sortConversations, validGroupMembers } from '../utils/chat';

const asRecord = <T,>(value: unknown) => (value || {}) as Record<string, T>;
type PresenceRecord = { sessions?: Record<string, boolean>; lastSeen?: number };
const withPresence = (profile: UserProfile, state?: PresenceRecord): UserProfile => ({
  ...profile,
  online: Object.keys(state?.sessions || {}).length > 0,
  lastSeen: state?.lastSeen || profile.lastSeen,
});

export function subscribeToUsers(callback: (users: UserProfile[]) => void) {
  let users: UserProfile[] = [];
  let presence: Record<string, PresenceRecord> = {};
  const emit = () => callback(users.map(profile => withPresence(profile, presence[profile.uid])));
  const stopUsers = onValue(ref(database, 'users'), snapshot => { users = Object.values(asRecord<UserProfile>(snapshot.val())); emit(); });
  const stopPresence = onValue(ref(database, 'presence'), snapshot => { presence = asRecord<PresenceRecord>(snapshot.val()); emit(); });
  return () => { stopUsers(); stopPresence(); };
}

export function subscribeToUser(uid: string, callback: (user: UserProfile | null) => void) {
  let user: UserProfile | null = null;
  let presence: PresenceRecord | undefined;
  const emit = () => callback(user ? withPresence(user, presence) : null);
  const stopUser = onValue(ref(database, `users/${uid}`), snapshot => { user = snapshot.val() as UserProfile | null; emit(); });
  const stopPresence = onValue(ref(database, `presence/${uid}`), snapshot => { presence = snapshot.val() as PresenceRecord | undefined; emit(); });
  return () => { stopUser(); stopPresence(); };
}

export function subscribeToConversations(uid: string, callback: (conversations: ConversationSummary[]) => void) {
  return onValue(ref(database, `userConversations/${uid}`), snapshot => {
    const summaries = Object.entries(asRecord<Omit<ConversationSummary, 'chatId'>>(snapshot.val()))
      .map(([chatId, summary]) => ({ chatId, ...summary }));
    callback(sortConversations(summaries));
  });
}

export function subscribeToConversation(chatId: string, callback: (conversation: Conversation | null) => void) {
  return onValue(ref(database, `conversations/${chatId}/metadata`), async snapshot => {
    const metadata = snapshot.val() as { kind?: 'direct' | 'group'; name?: string; createdBy?: string; createdAt?: number } | null;
    try {
      const members = asRecord<boolean>((await get(ref(database, `conversations/${chatId}/members`))).val());
      callback(Object.keys(members).length ? { kind: metadata?.kind || 'direct', name: metadata?.name, createdBy: metadata?.createdBy, createdAt: metadata?.createdAt, members } : null);
    } catch { callback(null); }
  });
}

export function subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
  return onValue(ref(database, `conversations/${chatId}/messages`), snapshot => {
    const messages = Object.entries(asRecord<Omit<ChatMessage, 'id'>>(snapshot.val()))
      .map(([id, message]) => ({ id, ...message }))
      .sort((left, right) => left.createdAt - right.createdAt);
    callback(messages);
  });
}

export function subscribeToLastMessage(chatId: string, messageId: string, callback: (message: ChatMessage | null) => void) {
  return onValue(ref(database, `conversations/${chatId}/messages/${messageId}`), snapshot => {
    const value = snapshot.val();
    callback(value ? { id: messageId, ...value } : null);
  });
}

export function subscribeToReadState(chatId: string, callback: (state: Record<string, number>) => void) {
  return onValue(ref(database, `conversations/${chatId}/readAt`), snapshot => callback(asRecord<number>(snapshot.val())));
}

export function subscribeToNotifications(uid: string, callback: (items: ChatNotification[]) => void) {
  return onValue(ref(database, `notifications/${uid}`), snapshot => {
    const items = Object.entries(asRecord<Omit<ChatNotification, 'id'>>(snapshot.val()))
      .map(([id, item]) => ({ id, ...item })).sort((a, b) => b.createdAt - a.createdAt);
    callback(items);
  });
}

async function sendPayload(uid: string, chatId: string, payload: MessagePayload) {
  const members = asRecord<boolean>((await get(ref(database, `conversations/${chatId}/members`))).val());
  if (!members[uid]) throw new Error('Bạn không thuộc cuộc trò chuyện này');
  const metadata = (await get(ref(database, `conversations/${chatId}/metadata`))).val() as { kind?: 'direct' | 'group'; name?: string } | null;
  const memberIds = Object.keys(members).filter(id => members[id]);
  if (metadata?.kind !== 'group' &&
      (memberIds.length !== 2 || createChatId(memberIds[0], memberIds[1]) !== chatId)) {
    throw new Error('Cuộc trò chuyện 1-1 có thành viên không hợp lệ');
  }
  const messageId = push(ref(database, `conversations/${chatId}/messages`)).key;
  if (!messageId) throw new Error('Không tạo được mã tin nhắn');
  const recipients = memberIds.filter(id => id !== uid);
  const active = await Promise.all(recipients.map(async id => {
    try { return Object.keys(asRecord((await get(ref(database, `activeChats/${chatId}/${id}`))).val())).length > 0; }
    catch { return false; }
  }));
  const updates: Record<string, unknown> = {
    [`conversations/${chatId}/messages/${messageId}`]: { ...payload, createdAt: serverTimestamp() },
  };
  for (const id of memberIds) {
    const base = `userConversations/${id}/${chatId}`;
    updates[`${base}/kind`] = metadata?.kind || 'direct';
    if (metadata?.kind === 'group') updates[`${base}/groupName`] = metadata.name || '';
    else updates[`${base}/partnerId`] = memberIds.find(other => other !== id) || '';
    updates[`${base}/lastMessageId`] = messageId;
    updates[`${base}/lastMessage`] = messagePreview(payload);
    updates[`${base}/lastMessageType`] = payload.type;
    updates[`${base}/lastMessageAt`] = serverTimestamp();
    updates[`${base}/unreadCount`] = id === uid ? 0 : increment(1);
  }
  await update(ref(database), updates);
  await Promise.allSettled(recipients.map((id, index) => active[index]
    ? Promise.resolve()
    : set(ref(database, `notifications/${id}/${chatId}_${messageId}`), {
      type: 'message', chatId, actorId: uid, messageId, createdAt: serverTimestamp(),
    })));
  return messageId;
}

async function ensureDirectConversation(uid: string, partnerId: string) {
  const chatId = createChatId(uid, partnerId);
  try {
    const existing = await get(ref(database, `conversations/${chatId}`));
    const value = existing.val() as { members?: Record<string, boolean>; metadata?: { kind?: string } } | null;
    if (value) {
      const memberIds = Object.keys(value.members || {}).filter(id => value.members?.[id]);
      if (memberIds.length !== 2 || !memberIds.includes(uid) || !memberIds.includes(partnerId) ||
          (value.metadata && value.metadata.kind !== 'direct')) {
        throw new Error('Cuộc trò chuyện 1-1 có thành viên không hợp lệ');
      }
      return chatId;
    }
  } catch (error) {
    const code = String((error as { code?: string })?.code || error).toLowerCase();
    if (!code.includes('permission')) throw error;
  }
  const [memberA, memberB] = [uid, partnerId].sort();
  await set(ref(database, `conversations/${chatId}`), {
    members: { [uid]: true, [partnerId]: true },
    metadata: { kind: 'direct', memberA, memberB },
  });
  return chatId;
}

export const openDirectConversation = ensureDirectConversation;

export async function sendTextMessage(uid: string, partnerId: string, text: string) {
  const payload = buildTextMessage(uid, text);
  if (!payload) return false;
  await sendPayload(uid, await ensureDirectConversation(uid, partnerId), payload);
  return true;
}

export async function sendChatTextMessage(uid: string, chatId: string, text: string) {
  const payload = buildTextMessage(uid, text);
  if (!payload) return false;
  await sendPayload(uid, chatId, payload);
  return true;
}

export async function sendLocationMessage(uid: string, partnerId: string, latitude: number, longitude: number) {
  await sendPayload(uid, await ensureDirectConversation(uid, partnerId), buildLocationMessage(uid, latitude, longitude));
}

export function sendChatLocationMessage(uid: string, chatId: string, latitude: number, longitude: number) {
  return sendPayload(uid, chatId, buildLocationMessage(uid, latitude, longitude));
}

export function sendChatImageMessage(uid: string, chatId: string, imageUrl: string) {
  return sendPayload(uid, chatId, { senderId: uid, type: 'image', text: '', imageUrl });
}

export async function createGroup(uid: string, name: string, selectedIds: string[]) {
  const groupName = name.trim();
  if (!groupName || !validGroupMembers(uid, selectedIds)) throw new Error('Nhập tên nhóm và chọn ít nhất 2 thành viên');
  const chatId = `group-${push(ref(database, 'conversations')).key}`;
  const members = Object.fromEntries([uid, ...new Set(selectedIds.filter(id => id !== uid))].map(id => [id, true]));
  await set(ref(database, `conversations/${chatId}`), {
    members, metadata: { kind: 'group', name: groupName, createdBy: uid, createdAt: serverTimestamp() },
  });
  const updates: Record<string, unknown> = {};
  Object.keys(members).forEach(id => {
    updates[`userConversations/${id}/${chatId}`] = { kind: 'group', groupName, lastMessage: '', lastMessageType: 'text', lastMessageAt: serverTimestamp(), unreadCount: 0 };
    if (id !== uid) {
      updates[`notifications/${id}/${chatId}_invite`] = { type: 'group_invite', chatId, actorId: uid, createdAt: serverTimestamp() };
    }
  });
  await update(ref(database), updates);
  return chatId;
}

export function markConversationAsRead(uid: string, chatId: string) {
  return update(ref(database), {
    [`conversations/${chatId}/readAt/${uid}`]: serverTimestamp(),
    [`userConversations/${uid}/${chatId}/unreadCount`]: 0,
  });
}

export function recallMessage(uid: string, chatId: string, message: ChatMessage) {
  if (message.senderId !== uid || message.recalled) throw new Error('Không thể thu hồi tin nhắn này');
  return update(ref(database, `conversations/${chatId}/messages/${message.id}`), { recalled: true, recalledAt: serverTimestamp() });
}

export async function reactToMessage(uid: string, chatId: string, message: ChatMessage, emoji: string) {
  if (message.recalled) throw new Error('Tin nhắn đã thu hồi');
  const reactionRef = ref(database, `conversations/${chatId}/messages/${message.id}/reactions/${uid}`);
  const previous = (await get(reactionRef)).val();
  const next = previous === emoji ? null : emoji;
  await set(reactionRef, next);
  if (next && !previous && message.senderId !== uid) {
    await Promise.allSettled([set(ref(database, `notifications/${message.senderId}/${chatId}_${message.id}_${uid}`), {
      type: 'reaction', chatId, actorId: uid, messageId: message.id, createdAt: serverTimestamp(),
    })]);
  }
}

export function markNotificationRead(uid: string, id: string) {
  return update(ref(database, `notifications/${uid}/${id}`), { readAt: serverTimestamp() });
}

export function markAllNotificationsRead(uid: string, items: ChatNotification[]) {
  const updates: Record<string, unknown> = {};
  items.filter(item => !item.readAt).forEach(item => { updates[`notifications/${uid}/${item.id}/readAt`] = serverTimestamp(); });
  return Object.keys(updates).length ? update(ref(database), updates) : Promise.resolve();
}

export { createChatId };
