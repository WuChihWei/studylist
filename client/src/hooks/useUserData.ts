import { useState, useEffect } from 'react';
import { User } from '../types/User';
import { useFirebase } from '../app/firebase/FirebaseProvider';

interface MaterialInput {
  type: string;
  title: string;
  url?: string | null;
  rating?: number;
  dateAdded?: Date;
}

interface MaterialPayload {
  type: 'webpage' | 'book' | 'video' | 'podcast';
  title: string;
  url: string | null;
  rating: number;
  dateAdded: string;
}

export const useUserData = () => {
  const { auth } = useFirebase();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (auth.currentUser) {
        await fetchUserData(auth.currentUser);
      }
    };

    fetchData();
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData(user);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const fetchUserData = async (currentUser: any) => {
    try {
      if (!currentUser) {
        setUserData(null);
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/${currentUser.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch user data');
      const data: User = await response.json();
      setUserData(data);
      localStorage.setItem('userData', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching user data:', error);
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = async (materialData: MaterialInput) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      if (!materialData.type || !materialData.title) {
        throw new Error('Missing required fields');
      }

      const payload: MaterialPayload = {
        type: materialData.type as MaterialPayload['type'],
        title: materialData.title,
        url: materialData.url?.trim() || null,
        rating: materialData.rating || 5,
        dateAdded: new Date().toISOString()
      };

      console.log('Sending payload:', payload);
      console.log('User ID:', user.uid);

      const token = await user.getIdToken();
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/${user.uid}/materials`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Error response body:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
          const rawText = await response.text();
          console.error('Raw response:', rawText);
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('Success response:', responseData);

      // Update local state with new data
      setUserData(prev => prev ? {
        ...prev,
        materials: responseData.materials
      } : null);

      // Update localStorage
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        localStorage.setItem('userData', JSON.stringify({
          ...parsedData,
          materials: responseData.materials
        }));
      }

      return true;
    } catch (error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  };

  return { userData, loading, fetchUserData, addMaterial };
};