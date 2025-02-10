"use client";

import { useState, useEffect } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, signOut } from 'firebase/auth';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      localStorage.removeItem('isLoggedIn');
      console.log("User logged out");
    } catch (error: any) {
      console.error("Error logging out:", error);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Starting signup process...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      console.log('Firebase signup successful, token:', token);
      
      try {

        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users`, {
        const response = await fetch(`https://studylist-server.onrender.com/api/users`, {
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
        {/* <button className={styles.howItWorks}>How it works</button> */}
      </div>

      <div className={styles.rightSection}>
        <div className={styles.signupBox}>
          <h2>Hello!</h2>
          {/* <p>Sign Up Get Started</p>

          <div className={styles.socialButtons}>
            <button onClick={handleGoogleSignup} className={styles.googleButton}>
              Sign Up With Google
            </button>
            <button onClick={handleFacebookSignup} className={styles.facebookButton}>
              Sign Up With Facebook
            </button>
          </div> */}

          {/* <div className={styles.divider}>or</div> */}

          {!isLoggedIn ? (
            <form onSubmit={handleSignup} className={styles.form}>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
              <button type="submit" className={styles.registerButton}>
                Register
              </button>
            </form>
          ) : (
            <button onClick={handleLogout} className={styles.registerButton}>Logout</button>
          )}

          {error && <div className={styles.error}>{error}</div>}
          
          <p className={styles.loginLink}>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </div>

      {showPopup && (
        <div className={styles.popup}>
          <p>Registration successful!</p>
          <button onClick={() => {
            setShowPopup(false);
            router.push('/profile');
          }}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default SignupPage;