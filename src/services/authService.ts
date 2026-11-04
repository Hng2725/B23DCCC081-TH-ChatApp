import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { ref, serverTimestamp, set, update } from 'firebase/database';
import { auth, database } from './firebase';
import type { AppUser, UserProfile } from '../types/chat';

const avatarColors = ['#1890ff', '#f56a00', '#7265e6', '#00a2ae', '#87d068', '#d46b08'];

function avatarColorFor(uid: string) {
  const total = [...uid].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return avatarColors[total % avatarColors.length];
}

export function getAuthErrorMessage(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Email hoặc mật khẩu không đúng';
  }
  if (code === 'auth/email-already-in-use') return 'Email này đã được sử dụng';
  if (code === 'auth/invalid-email') return 'Email không hợp lệ';
  if (code === 'auth/weak-password') return 'Mật khẩu phải có ít nhất 6 ký tự';
  return 'Không thể kết nối Firebase. Hãy kiểm tra cấu hình Firebase và mạng.';
}

export async function registerWithEmail(displayName: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(credential.user, { displayName: displayName.trim() });
  const profile: UserProfile = {
    uid: credential.user.uid,
    displayName: displayName.trim(),
    email: email.trim(),
    avatarColor: avatarColorFor(credential.user.uid),
    online: true,
    lastSeen: Date.now(),
  };
  await set(ref(database, `users/${credential.user.uid}`), profile);
  return credential.user;
}

export function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logout() {
  if (auth.currentUser) {
    await update(ref(database, `users/${auth.currentUser.uid}`), {
      online: false,
      lastSeen: serverTimestamp(),
    });
  }
  return signOut(auth);
}

export function subscribeToAuth(callback: (user: AppUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
