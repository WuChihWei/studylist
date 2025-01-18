'use client';

import { createContext, useContext, ReactNode } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBNmye0tQ_98FByjEL-UHPEe0e0ccN5R8Y",
  authDomain: "studylist-6c2a5.firebaseapp.com",
  projectId: "studylist-6c2a5",
  storageBucket: "studylist-6c2a5.firebasestorage.app",
  messagingSenderId: "923896241653",
  appId: "1:923896241653:web:aff6fb11cc6e4c9bac94bc",
  measurementId: "G-C6PQFDQPRW"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const FirebaseContext = createContext<{ auth: Auth }>({ auth });

export function FirebaseProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseContext.Provider value={{ auth }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext); 