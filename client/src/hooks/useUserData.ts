import { useState, useEffect } from 'react';
import { auth } from '../app/firebase/firebaseConfig';
import { User } from '../types/User';

export const useUserData = () => {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:5000/api/users/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch user data');
      const data: User = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = async (materialData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:5000/api/users/${user.uid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          materials: [...userData.materials, materialData]
        })
      });

      if (!response.ok) throw new Error('Failed to add material');
      const updatedUser = await response.json();
      setUserData(updatedUser);
      return true;
    } catch (error) {
      console.error('Error adding material:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return { userData, loading, fetchUserData, addMaterial };
};