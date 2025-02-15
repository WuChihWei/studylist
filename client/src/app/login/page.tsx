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
      console.log('Starting login process...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase auth successful');
      
      const token = await userCredential.user.getIdToken();
      console.log('Token obtained successfully');
      
      const apiUrl = 'https://studylist-server.onrender.com';
      const requestUrl = `${apiUrl}/api/users/${userCredential.user.uid}`;
      console.log('Making request to:', requestUrl);
      
      try {
        console.log('Starting fetch request...');
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          mode: 'cors'
        });
        
        console.log('Response received:', {
          status: response.status,
          statusText: response.statusText
        });

        if (response.status === 400) {
          console.log('User not found, creating new user...');
          const createResponse = await fetch(`${apiUrl}/api/users`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              firebaseUID: userCredential.user.uid,
              name: 'New User',
              email: email,
              materials: []
            })
          });
          
          console.log('Create user response:', {
            status: createResponse.status,
            statusText: createResponse.statusText
          });

          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('Create user error:', errorText);
            throw new Error(`Failed to create user: ${createResponse.status}`);
          }
          
          const userData = await createResponse.json();
          console.log('User created successfully:', userData);
          
          localStorage.setItem('userData', JSON.stringify(userData));
          setIsLoggedIn(true);
          localStorage.setItem('isLoggedIn', 'true');
          
          console.log('Redirecting to profile...');
          await router.push('/profile');
          return;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          throw new Error(`Server error: ${response.status}`);
        }
        
        const userData = await response.json();
        console.log('Login successful, user data:', userData);
        
        localStorage.setItem('userData', JSON.stringify(userData));
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
        
        console.log('Redirecting to profile...');
        await router.push('/profile');
        
      } catch (fetchError) {
        console.error('Fetch error:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        });
        setError('Failed to fetch user data. Please try again.');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || 'An error occurred during login');
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
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      console.log('Google auth successful');
      
      const token = await userCredential.user.getIdToken();
      console.log('Token obtained successfully');
      
      const apiUrl = 'https://studylist-server.onrender.com';
      const requestUrl = `${apiUrl}/api/users/${userCredential.user.uid}`;
      console.log('Making request to:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log('Login successful, received user data:', userData);
      
      localStorage.setItem('userData', JSON.stringify(userData));
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      setShowPopup(true);
      router.push('/profile');
    } catch (error: any) {
      console.error("Google login error:", error);
      setError(error.message || 'An error occurred during Google login');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      console.log('Facebook auth successful');
      
      const token = await userCredential.user.getIdToken();
      console.log('Token obtained successfully');
      
      const apiUrl = 'https://studylist-server.onrender.com';
      const requestUrl = `${apiUrl}/api/users/${userCredential.user.uid}`;
      console.log('Making request to:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log('Login successful, received user data:', userData);
      
      localStorage.setItem('userData', JSON.stringify(userData));
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      setShowPopup(true);
      router.push('/profile');
    } catch (error: any) {
      console.error("Facebook login error:", error);
      setError(error.message || 'An error occurred during Facebook login');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <h1>Learn With Your Role Models</h1>
        <p>To create the most motivating learning methods</p>
        {/* <button className={styles.howItWorks}>How it works</button> */}
      </div>
      
      <div className={styles.loginSection}>
        <h2>Hello Again!</h2>
        {/* <p className={styles.welcomeText}>Welcome Back</p>
        
        {error && <p className={styles.errorMessage}>{error}</p>}
        
        <button onClick={handleFacebookLogin} className={styles.facebookButton}>
          <span className={styles.icon}>f</span>
          Log In With Facebook
        </button>
        
        <button onClick={handleGoogleLogin} className={styles.googleButton}>
          <span className={styles.icon}>G</span>
          Log In With Google
        </button> */}

        {/* <div className={styles.divider}>
          <span>or</span>
        </div> */}

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