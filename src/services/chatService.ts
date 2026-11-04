import { onValue, push, ref, serverTimestamp, set, update } from 'firebase/database';
import { database } from './firebase';
import type { ChatMessage, ConversationSummary, UserProfile } from '../types/chat';
import { buildLocationMessage, buildTextMessage, createChatId, type MessagePayload, sortConversations } from '../utils/chat';

const asRecord = <T,>(value: unknown) => (value || {}) as Record<string, T>;

export function subscribeToUsers(callback: (users: UserProfile[]) => void) {
  return onValue(ref(database, 'users'), snapshot => {
    callback(Object.values(asRecord<UserProfile>(snapshot.val())));
  });
}

export function subscribeToUser(uid: string, callback: (user: UserProfile | null) => void) {
  return onValue(ref(database, `users/${uid}`), snapshot => callback(snapshot.val() as UserProfile | null));
}

export function subscribeToConversations(uid: string, callback: (conversations: ConversationSummary[]) => void) {
  return onValue(ref(database, `userConversations/${uid}`), snapshot => {
    const summaries = Object.entries(asRecord<Omit<ConversationSummary, 'chatId'>>(snapshot.val()))
      .map(([chatId, summary]) => ({ chatId, ...summary }));
    callback(sortConversations(summaries));
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

async function sendPayload(currentUserId: string, partnerId: string, payload: MessagePayload) {
  const chatId = createChatId(currentUserId, partnerId);
  const messageRef = push(ref(database, `conversations/${chatId}/messages`));
  const messagePath = `conversations/${chatId}/messages/${messageRef.key}`;
  const message = { ...payload, createdAt: serverTimestamp() };

  try {
    await set(ref(database, messagePath), message);
  } catch (error) {
    const code = String((error as { code?: unknown })?.code || '').toLowerCase();
    const details = String(error).toLowerCase();
    if (!code.includes('permission') && !details.includes('permission')) throw error;

    // A new conversation has no membership yet, so its first message is denied.
    // Create the immutable two-user membership once, then retry the message.
    await update(ref(database, `conversations/${chatId}/members`), {
      [currentUserId]: true,
      [partnerId]: true,
    });
    await set(ref(database, messagePath), message);
  }

  const summary = {
    partnerId,
    lastMessage: payload.text,
    lastMessageType: payload.type,
    lastMessageAt: serverTimestamp(),
  };

  // The message is already durable. Summary/unread failures must not make the
  // UI report that the message itself failed or cause the user to send it twice.
  await Promise.allSettled([
    update(ref(database, `userConversations/${currentUserId}/${chatId}`), {
      ...summary,
      unreadCount: 0,
    }),
    update(ref(database, `userConversations/${partnerId}/${chatId}`), {
      ...summary,
      partnerId: currentUserId,
      unreadCount: 1,
    }),
  ]);
}

export async function sendTextMessage(currentUserId: string, partnerId: string, text: string) {
  const payload = buildTextMessage(currentUserId, text);
  if (!payload) return false;
  await sendPayload(currentUserId, partnerId, payload);
  return true;
}

export function sendLocationMessage(currentUserId: string, partnerId: string, latitude: number, longitude: number) {
  return sendPayload(currentUserId, partnerId, buildLocationMessage(currentUserId, latitude, longitude));
}

export function markConversationAsRead(uid: string, chatId: string) {
  return update(ref(database, `userConversations/${uid}/${chatId}`), { unreadCount: 0 });
}

export { createChatId };
