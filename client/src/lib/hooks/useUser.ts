import { useState, useEffect } from 'react';
import { useFirebase } from '../../app/firebase/FirebaseProvider';

export const useUser = () => {
  const { auth } = useFirebase();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/users/${auth.currentUser.uid}`
          );
          const data = await response.json();
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [auth.currentUser]);

  return { userData, loading };
};