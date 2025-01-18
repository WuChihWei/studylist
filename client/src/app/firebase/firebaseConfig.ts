'use client';

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBNmye0tQ_98FByjEL-UHPEe0e0ccN5R8Y",
  authDomain: "studylist-6c2a5.firebaseapp.com",
  projectId: "studylist-6c2a5",
  storageBucket: "studylist-6c2a5.firebasestorage.app",
  messagingSenderId: "923896241653",
  appId: "1:923896241653:web:aff6fb11cc6e4c9bac94bc",
  measurementId: "G-C6PQFDQPRW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };