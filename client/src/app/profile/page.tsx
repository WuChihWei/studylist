"use client";
import { useState } from 'react';
import { useUserData } from '../../hooks/useUserData';
import styles from './profile.module.css';
import Image from 'next/image';

export default function ProfilePage() {
  const { userData, loading, addMaterial } = useUserData();
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: '',
    url: '',
    rating: 5
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addMaterial({
      ...newMaterial,
      dateAdded: new Date()
    });

    if (success) {
      setNewMaterial({ title: '', type: '', url: '', rating: 5 });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!userData) return <div>Please log in</div>;

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        {/* <div className={styles.profileInfo}>
          <Image
            src="/avatar-placeholder.png"
            alt="Profile"
            width={80}
            height={80}
            className={styles.avatar}
          />
          <div>
            <h1>{userData.name}</h1>
            <a href={`davinc.in/${userData.name.toLowerCase()}`} className={styles.profileLink}>
              davinc.in/{userData.name.toLowerCase()}
            </a>
            <p className={styles.bio}>
              Hi! I'm Eric, a content creator known for engaging and quality content across blogs, social media, and more. Eager to bring your brand's story to life!
            </p>
          </div>
        </div> */}
      </div>

      <div className={styles.contentTabs}>
        <button className={`${styles.tab} ${styles.active}`}>Media</button>
        <button className={styles.tab}>Subject1</button>
        <button className={styles.tab}>Subject2</button>
      </div>

      <div className={styles.materialsSection}>
        {['webpage', 'book', 'video', 'podcast'].map(type => (
          <div key={type} className={styles.materialCategory}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryIcon}>
                {type === 'webpage' && '🌐'}
                {type === 'book' && '📚'}
                {type === 'video' && '🎥'}
                {type === 'podcast' && '🎧'}
              </span>
              <h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
            </div>
            <ul className={styles.materialsList}>
              {userData.materials
                .filter(m => m.type === type)
                .map((material, index) => (
                  <li key={index} className={styles.materialItem}>
                    <span className={styles.materialIcon}>📄</span>
                    <div className={styles.materialInfo}>
                      <span className={styles.materialTitle}>{material.title}</span>
                      <a href={material.url} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className={styles.materialUrl}>
                        {material.url}
                      </a>
                    </div>
                    <span className={styles.materialRating}>
                      <span className={styles.ratingNumber}>12</span>
                      <button className={styles.ratingButton}>👍</button>
                      <button className={styles.ratingButton}>👎</button>
                      <button className={styles.moreButton}>+</button>
                    </span>
                  </li>
                ))}
              <li className={styles.addMaterial}>
                <button className={styles.addButton}>+ Add New Material...</button>
              </li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}