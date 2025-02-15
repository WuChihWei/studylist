import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <h1>DAVINCI</h1>
        <span>da Vinci to nth power</span>
      </div>
      <div className={styles.navItems}>
        {/* <a href="#how-it-works">How It Works</a> */}
        <a href="/">Home</a>
        <Link href="/profile" className={styles.navLink}>My Profile</Link>
        <Link href="/login" className={styles.loginButton}>Login</Link>
        <Link href="/signup" className={styles.loginButton}>signup</Link>
      </div>
    </header>
  );
};

export default Navbar; 