import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAjUi4Zev_noI0XqLqAnPpuEECK55anhmo',
  authDomain: 'chatapp-29f27.firebaseapp.com',
  databaseURL: 'https://chatapp-29f27-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'chatapp-29f27',
  storageBucket: 'chatapp-29f27.firebasestorage.app',
  messagingSenderId: '63304454714',
  appId: '1:63304454714:web:88e65998df64599196db03',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// Firebase's React Native entrypoint exposes this API at runtime; its public
// TypeScript declaration currently omits the platform-specific export.
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => any;
};

let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const database = getDatabase(app);
