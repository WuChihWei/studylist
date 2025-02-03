"use client";
import { useState, useEffect } from 'react';
import { useUserData } from '../../../hooks/useUserData';
import styles from './edit.module.css';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaImage } from 'react-icons/fa';

export default function EditProfilePage() {
  const router = useRouter();
  const { userData, loading, updateProfile } = useUserData();
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [charCount, setCharCount] = useState(0);
  const MAX_BIO_LENGTH = 150;

  useEffect(() => {
    if (userData) {
      setEditedName(userData.name || '');
      setEditedBio(userData.bio || 'Introduce yourself');
      setCharCount(userData.bio?.length || 0);
    }
  }, [userData]);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_BIO_LENGTH) {
      setEditedBio(text);
      setCharCount(text.length);
    }
  };

  const handleSave = async () => {
    if (await updateProfile({ name: editedName, bio: editedBio })) {
      router.push('/profile');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!userData) return <div>Please log in</div>;

  return (
    <div className={styles.editProfileContainer}>
      <h1>Edit Profile</h1>
      
      <div className={styles.profileImageSection}>
        <div className={styles.imageContainer}>
          <FaImage size={50} color="#666" />
        </div>
        <button className={styles.uploadButton}>
          Upload Image
        </button>
      </div>

      <div className={styles.formSection}>
        <label>
          User Name
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className={styles.editInput}
            placeholder="Enter your name"
          />
        </label>

        <label>
          Bio
          <textarea
            value={editedBio}
            onChange={handleBioChange}
            className={styles.editBio}
            placeholder="Tell us about yourself"
          />
          <div className={styles.charCount}>
            {charCount} / {MAX_BIO_LENGTH}
          </div>
        </label>

        <div className={styles.buttonGroup}>
          <button onClick={handleSave} className={styles.saveButton}>
            Save
          </button>
          <button 
            onClick={() => router.push('/profile')} 
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}