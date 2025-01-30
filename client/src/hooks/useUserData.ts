import { useState, useEffect } from 'react';
import { auth } from '../app/firebase/firebaseConfig';
import { User } from '../types/User';
import { onAuthStateChanged } from 'firebase/auth';

export const useUserData = () => {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (currentUser: any) => {
    try {
      if (!currentUser) {
        setUserData(null);
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5001/api/users/${currentUser.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch user data');
      const data: User = await response.json();
      setUserData(data);
      // Store user data in localStorage
      localStorage.setItem('userData', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If there's an error, try to get data from localStorage
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = async (materialData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:5001/api/users/${user.uid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          materials: [...(userData?.materials || []), materialData]
        })
      });

      if (!response.ok) throw new Error('Failed to add material');
      const updatedUser = await response.json();
      setUserData(updatedUser);
      // Update localStorage when materials change
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('Error adding material:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        fetchUserData(user);
      } else {
        // User is signed out
        setUserData(null);
        localStorage.removeItem('userData');
        setLoading(false);
      }
    });

    // Try to load data from localStorage on initial mount
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      setUserData(JSON.parse(storedData));
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  return { userData, loading, fetchUserData, addMaterial };
};