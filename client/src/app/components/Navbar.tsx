import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import { auth } from '../firebase/firebaseConfig';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <h1>DAVINCI</h1>
        <span>da Vinci to nth power</span>
      </div>
      <div className={styles.navItems}>
        {/* <a href="#how-it-works">How It Works</a> */}
        <a href="/">Home</a>
        {isLoggedIn ? (
          <>
            <Link href="/profile" className={styles.navLink}>My Profile</Link>
            <button onClick={() => auth.signOut()} className={styles.loginButton}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.loginButton}>Login</Link>
            <Link href="/signup" className={styles.loginButton}>Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar; 