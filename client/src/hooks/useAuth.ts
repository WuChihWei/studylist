'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useFirebase } from '../app/firebase/FirebaseProvider';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { auth } = useFirebase();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
} 