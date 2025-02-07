"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import styles from './login.module.css';
import Link from 'next/link';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check local storage for login state
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // 获取用户数据
      // const response = await fetch(`http://localhost:5001/api/users/${userCredential.user.uid}`, {
      const response = await fetch(`https://studylist-server.onrender.com/api/users/${userCredential.user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user data');
      
      const userData = await response.json();
      localStorage.setItem('userData', JSON.stringify(userData));
      
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/profile');
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      localStorage.removeItem('isLoggedIn'); // Clear login state
      console.log("User logged out");
    } catch (error: any) {
      console.error("Error logging out:", error);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleFacebookLogin = async () => {
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
      
      <div className={styles.loginSection}>
        <h2>Hello Again!</h2>
        <p className={styles.welcomeText}>Welcome Back</p>
        
        {error && <p className={styles.errorMessage}>{error}</p>}
        
        <button onClick={handleFacebookLogin} className={styles.facebookButton}>
          <span className={styles.icon}>f</span>
          Log In With Facebook
        </button>
        
        <button onClick={handleGoogleLogin} className={styles.googleButton}>
          <span className={styles.icon}>G</span>
          Log In With Google
        </button>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        {!isLoggedIn ? (
          <form onSubmit={handleLogin} className={styles.form}>
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
            <button type="submit" className={styles.loginButton}>Login</button>
          </form>
        ) : (
          <button onClick={handleLogout} className={styles.loginButton}>Logout</button>
        )}
        
        {showPopup && (
          <div className={styles.popup}>
            <p>Login successful!</p>
            <button onClick={() => {
              setShowPopup(false);
              router.push('/profile');
            }}>Continue</button>
          </div>
        )}
      
        <div className={styles.links}>
          <a href="#forgot-password" className={styles.forgotPassword}>
            Forgot Password?
          </a>
          <div>
            <Link href="/signup" className={styles.signupLink}>
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;