import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('firebase/app', () => ({ getApp: jest.fn(), getApps: jest.fn(() => [{}]), initializeApp: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('firebase/auth', () => ({ getAuth: jest.fn(), getReactNativePersistence: jest.fn(), initializeAuth: jest.fn(), onAuthStateChanged: (_auth: unknown, callback: (user: null) => void) => { callback(null); return jest.fn(); }, createUserWithEmailAndPassword: jest.fn(), signInWithEmailAndPassword: jest.fn(), signOut: jest.fn(), updateProfile: jest.fn() }));
jest.mock('firebase/database', () => ({ getDatabase: jest.fn(), onDisconnect: jest.fn(() => ({ update: jest.fn() })), onValue: jest.fn(() => jest.fn()), push: jest.fn(() => ({ key: 'message' })), ref: jest.fn(), runTransaction: jest.fn(), serverTimestamp: jest.fn(), update: jest.fn(), set: jest.fn(), get: jest.fn() }));
jest.mock('@react-native-community/geolocation', () => ({ getCurrentPosition: jest.fn() }));

import App from '../App';

test('renders the signed-out authentication flow', async () => {
  await ReactTestRenderer.act(() => { ReactTestRenderer.create(<App />); });
});
