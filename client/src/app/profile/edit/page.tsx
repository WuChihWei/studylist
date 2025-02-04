"use client";
import { useState, useEffect } from 'react';
import { useUserData } from '../../../hooks/useUserData';
import { storage, auth } from '../../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    try {
      setUploading(true);
      const file = e.target.files[0];
      
      // 創建預覽
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // 上傳到 Firebase Storage
      const storageRef = ref(storage, `profile-images/${auth.currentUser?.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // 更新用戶資料，使用當前編輯狀態的值
      await updateProfile({ 
        name: editedName,
        bio: editedBio,
        photoURL: downloadURL 
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!userData) return <div>Please log in</div>;

  return (
    <div className={styles.editProfileContainer}>
      <h1>Edit Profile</h1>
      
      <div className={styles.profileImageSection}>
        <div className={styles.imageContainer}>
          {imagePreview || userData?.photoURL ? (
            <Image
              src={imagePreview || userData?.photoURL || ''}
              alt="Profile"
              fill
              style={{ objectFit: 'cover' }}
              className={styles.profileImage}
              unoptimized
            />
          ) : (
            <FaImage size={50} color="#666" />
          )}
        </div>
        <input
          type="file"
          id="imageUpload"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <label htmlFor="imageUpload" className={styles.uploadButton}>
          {uploading ? 'Uploading...' : 'Upload Image'}
        </label>
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