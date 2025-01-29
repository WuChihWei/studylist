"use client";

import { useState } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import styles from './signup.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SignupPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Starting signup process...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      console.log('Firebase signup successful, token:', token);
      
      try {
        const response = await fetch('http://localhost:5001/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            firebaseUID: userCredential.user.uid,
            name: name || 'New User',
            email: email,
            materials: []
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Server response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          throw new Error(`Server error: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Server response success:', responseData);

        localStorage.setItem('userData', JSON.stringify(responseData));
        localStorage.setItem('isLoggedIn', 'true');

        setShowPopup(true);
        router.replace('/profile');
      } catch (fetchError) {
        console.error('Network or server error:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message);
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

      {showPopup && (
        <div className={styles.popup}>
          <p>Registration successful!</p>
          <button onClick={() => {
            setShowPopup(false);
            router.push('/profile'); // 跳转到用户资料页面
          }}>Continue</button>
        </div>
      )}
    </div>
  );
};

export default SignupPage;