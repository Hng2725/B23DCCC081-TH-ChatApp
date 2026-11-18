import { AppState } from 'react-native';
import { onDisconnect, onValue, ref, remove, serverTimestamp, set } from 'firebase/database';
import { database } from './firebase';

const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const ignoreRejected = (promise: Promise<unknown>) => { promise.catch(() => undefined); };
const openChats = new Set<string>();

export type Presence = { online: boolean; lastSeen: number };

export async function clearPresence(uid: string) {
  await Promise.all([...openChats].flatMap(chatId => [
    remove(ref(database, `activeChats/${chatId}/${uid}/${sessionId}`)),
    remove(ref(database, `typing/${chatId}/${uid}/${sessionId}`)),
  ]));
  await remove(ref(database, `presence/${uid}/sessions/${sessionId}`));
  await set(ref(database, `presence/${uid}/lastSeen`), serverTimestamp());
}

export function subscribeToPresence(uid: string) {
  const sessionRef = ref(database, `presence/${uid}/sessions/${sessionId}`);
  const lastSeenRef = ref(database, `presence/${uid}/lastSeen`);
  let connected = false;
  let foreground = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
  let active = true;
  const join = async () => {
    if (!connected || !foreground || !active) return;
    await onDisconnect(sessionRef).remove();
    await onDisconnect(lastSeenRef).set(serverTimestamp());
    if (connected && foreground && active) await set(sessionRef, true);
  };
  const stopConnection = onValue(ref(database, '.info/connected'), snapshot => {
    connected = snapshot.val() === true;
    if (connected) ignoreRejected(join());
  });
  const appSubscription = AppState.addEventListener('change', state => {
    foreground = state === 'active';
    if (foreground) ignoreRejected(join());
    else { ignoreRejected(remove(sessionRef)); ignoreRejected(set(lastSeenRef, serverTimestamp())); }
  });
  return () => {
    active = false;
    stopConnection();
    appSubscription.remove();
    ignoreRejected(clearPresence(uid));
  };
}

export function watchUserPresence(uid: string, callback: (presence: Presence) => void) {
  return onValue(ref(database, `presence/${uid}`), snapshot => {
    const value = snapshot.val() || {};
    callback({ online: Object.keys(value.sessions || {}).length > 0, lastSeen: Number(value.lastSeen || 0) });
  });
}

export function enterChat(uid: string, chatId: string) {
  openChats.add(chatId);
  const activeRef = ref(database, `activeChats/${chatId}/${uid}/${sessionId}`);
  const typingRef = ref(database, `typing/${chatId}/${uid}/${sessionId}`);
  let open = true;
  let connected = false;
  let foreground = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
  const join = async () => {
    if (!connected || !foreground || !open) return;
    await onDisconnect(activeRef).remove();
    await onDisconnect(typingRef).remove();
    if (open && foreground) await set(activeRef, true);
  };
  const stopConnection = onValue(ref(database, '.info/connected'), snapshot => {
    connected = snapshot.val() === true;
    if (connected) ignoreRejected(join());
  });
  const appSubscription = AppState.addEventListener('change', state => {
    foreground = state === 'active';
    if (foreground) ignoreRejected(join());
    else { ignoreRejected(remove(activeRef)); ignoreRejected(remove(typingRef)); }
  });
  return () => {
    open = false;
    openChats.delete(chatId);
    stopConnection();
    appSubscription.remove();
    ignoreRejected(remove(activeRef));
    ignoreRejected(remove(typingRef));
  };
}

export function setTyping(uid: string, chatId: string) {
  return set(ref(database, `typing/${chatId}/${uid}/${sessionId}`), true);
}

export function clearTyping(uid: string, chatId: string) {
  return remove(ref(database, `typing/${chatId}/${uid}/${sessionId}`));
}

export function watchTyping(chatId: string, callback: (ids: string[]) => void) {
  return onValue(ref(database, `typing/${chatId}`), snapshot => {
    const value = snapshot.val() || {};
    callback(Object.keys(value).filter(uid => Object.keys(value[uid] || {}).length > 0));
  });
}
