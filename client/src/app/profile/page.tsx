"use client";
import { useState } from 'react';
import { useUserData } from '../../hooks/useUserData';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { userData, loading, addMaterial } = useUserData();
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: '',
    rating: 5
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addMaterial({
      ...newMaterial,
      dateAdded: new Date()
    });

    if (success) {
      setNewMaterial({ title: '', type: '', rating: 5 });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!userData) return <div>Please log in</div>;

  return (
    <div className={styles.profileContainer}>
      <h1>{userData.name}</h1>
      
      <div className={styles.importSection}>
        <h2>Import Material</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={newMaterial.title}
            onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
            placeholder="Material Title"
            required
          />
          <select
            value={newMaterial.type}
            onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
            required
          >
            <option value="">Select Type</option>
            <option value="book">Book</option>
            <option value="video">Video</option>
            <option value="podcast">Podcast</option>
          </select>
          <button type="submit">Add Material</button>
        </form>
      </div>

      <div className={styles.materialsSection}>
        {['book', 'video', 'podcast'].map(type => (
          <div key={type}>
            <h3>{type.charAt(0).toUpperCase() + type.slice(1)}s</h3>
            <ul>
              {userData.materials
                .filter(m => m.type === type)
                .map((material, index) => (
                  <li key={index}>
                    {material.title} - Rating: {material.rating}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}