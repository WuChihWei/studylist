"use client";

import { useState } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import styles from './signup.module.css';
import Link from 'next/link';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Add name to user profile if needed
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleFacebookSignup = async () => {
    const provider = new FacebookAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <h1>Learn With Your Role Models</h1>
        <p>To create the most motivating learning methods</p>
        <button className={styles.howItWorks}>How it works</button>
      </div>
      
      <div className={styles.signupSection}>
        <h2>Hello!</h2>
        <p className={styles.welcomeText}>Sign Up Get Started</p>
        
        <button onClick={handleFacebookSignup} className={styles.facebookButton}>
          <span className={styles.icon}>f</span>
          Sign Up With Facebook
        </button>
        
        <button onClick={handleGoogleSignup} className={styles.googleButton}>
          <span className={styles.icon}>G</span>
          Sign Up With Google
        </button>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <form onSubmit={handleSignup} className={styles.form}>
          {/* <input
            type="text"
            placeholder="ID Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          /> */}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className={styles.signupButton}>Register</button>
        </form>
        
        <Link href="/login" className={styles.loginLink}>
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
};

export default SignupPage;