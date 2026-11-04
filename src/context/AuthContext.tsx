import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../services/firebase';
import { subscribeToAuth } from '../services/authService';
import { subscribeToPresence } from '../services/presenceService';
import type { AppUser, UserProfile } from '../types/chat';

type AuthContextValue = { user: AppUser | null; profile: UserProfile | null; loading: boolean };
const AuthContext = createContext<AuthContextValue>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startupTimeout = setTimeout(() => setLoading(false), 4000);
    const unsubscribe = subscribeToAuth(nextUser => {
      clearTimeout(startupTimeout);
      setUser(nextUser);
      setLoading(false);
    });
    return () => {
      clearTimeout(startupTimeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return undefined;
    }
    const unsubscribeProfile = onValue(ref(database, `users/${user.uid}`), snapshot => setProfile(snapshot.val() as UserProfile | null));
    const unsubscribePresence = subscribeToPresence(user.uid);
    return () => {
      unsubscribeProfile();
      unsubscribePresence();
    };
  }, [user]);

  const value = useMemo(() => ({ user, profile, loading }), [user, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
