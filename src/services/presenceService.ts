import { onDisconnect, onValue, ref, serverTimestamp, update } from 'firebase/database';
import { database } from './firebase';

export function subscribeToPresence(uid: string) {
  const userRef = ref(database, `users/${uid}`);
  return onValue(ref(database, '.info/connected'), snapshot => {
    if (snapshot.val() !== true) return;

    onDisconnect(userRef).update({ online: false, lastSeen: serverTimestamp() });
    update(userRef, { online: true, lastSeen: serverTimestamp() });
  });
}
