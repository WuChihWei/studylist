'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Auth } from "firebase/auth";
import { auth } from './firebaseConfig';

const FirebaseContext = createContext<{ auth: Auth }>({ auth });

export function FirebaseProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseContext.Provider value={{ auth }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext); 