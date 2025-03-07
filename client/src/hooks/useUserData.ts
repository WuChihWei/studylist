import { useState, useEffect } from 'react';
import { User, MaterialInput } from '../types/User';
import { useFirebase } from '../app/firebase/FirebaseProvider';
import userApi from '../lib/api/userApi';
import { handleApiError } from '../lib/api/errorHandler';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001').replace(/\/+$/, '');

type MaterialType = 'webpage' | 'book' | 'video' | 'podcast';

interface MaterialPayload {
  type: MaterialType;
  title: string;
  url: string | null;
  rating: number;
  dateAdded: string;
}

interface MongoContribution {
  date: string;
  count: number;
  studyCount?: number;  // 從 MongoDB 返回的可能是可選的
}

interface ContributionData {
  date: string;
  count: number;
  studyCount: number;  // 但我們的應用中需要它是必需的
}

const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

export const useUserData = () => {
  const { auth } = useFirebase();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserData = async (currentUser: any, forceRefresh = false) => {
    if (isLoading) return;
    
    console.log('=== fetchUserData started ===');
    console.log('Current user:', currentUser?.uid);
    
    try {
      setIsLoading(true);
      const data = await userApi.getUserData(currentUser.uid);
      console.log('Received user data:', data);
      setUserData(data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch user data');
      setUserData(null);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    console.log('=== Auth state effect started ===');
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? `User logged in: ${user.uid}` : 'No user');
      if (user && isMounted) {
        console.log('Calling fetchUserData for user:', user.uid);
        fetchUserData(user);
      } else {
        console.log('Clearing user data');
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      console.log('Cleanup: unmounting component');
      isMounted = false;
      unsubscribe();
    };
  }, [auth]);

  const addMaterial = async (materialData: MaterialInput, topicId: string) => {
    // 只在開發環境中輸出日誌
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 materialData.favicon:', materialData.favicon);
    }
    
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('🔧 沒有用戶登錄');
        throw new Error('No user logged in');
      }

      console.log('🔧 準備調用 API', { uid: user.uid, topicId, materialData });
      const updatedUser = await userApi.addMaterial(user.uid, topicId, materialData);
      console.log('🔧 API 返回結果', updatedUser);
      
      // 檢查返回的用戶數據
      if (!updatedUser) {
        console.log('🔧 API 沒有返回用戶數據');
        throw new Error('API did not return user data');
      }
      
      // 檢查返回的主題是否包含新添加的材料
      const topic = updatedUser.topics?.find(t => t._id === topicId);
      if (topic) {
        if (topic.materials) {
          console.log('🔧 新數據結構 - 主題材料數量:', topic.materials.length);
        } else if (topic.categories) {
          const categoryType = materialData.type as keyof typeof topic.categories;
          console.log('🔧 舊數據結構 - 類別材料數量:', topic.categories[categoryType]?.length || 0);
        }
      } else {
        console.log('🔧 在返回的用戶數據中找不到主題:', topicId);
      }
      
      setUserData(updatedUser);
      return true;
    } catch (error) {
      console.error('🔧 添加材料錯誤:', error);
      handleApiError(error, 'Failed to add material');
      return false;
    }
  };

  const updateProfile = async (data: { name: string; bio: string; photoURL?: string }) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      
      console.log('Updating profile with data:', data);
      const updatedUser = await userApi.updateProfile(user.uid, data);
      setUserData(updatedUser);
      return true;
    } catch (error) {
      handleApiError(error, 'Failed to update profile');
      return false;
    }
  };

  const updateTopicName = async (topicId: string, name: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const token = await user.getIdToken();
      
      console.log('Updating topic:', {
        topicId,
        name,
        url: `${API_URL}/api/users/${user.uid}/topics/${topicId}`
      });
      
      const response = await fetch(
        `${API_URL}/api/users/${user.uid}/topics/${topicId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name })
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update topic name');
        } else {
          const text = await response.text();
          console.error('Unexpected response:', text);
          throw new Error(`Server error: ${response.status}`);
        }
      }
      
      const updatedUser = await response.json();
      setUserData(updatedUser);
      return true;
    } catch (error) {
      console.error('Error updating topic name:', error);
      return false;
    }
  };

  const addTopic = async (name: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const token = await user.getIdToken();
      
      console.log('Sending request to:', `${API_URL}/api/users/${user.uid}/topics`);
      
      const response = await fetch(
        `${API_URL}/api/users/${user.uid}/topics`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name })
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add topic');
        } else {
          const text = await response.text();
          console.error('Unexpected response:', text);
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
      return true;
    } catch (error) {
      console.error('Error adding topic:', error);
      return false;
    }
  };

  const getContributionData = (): ContributionData[] => {
    if (!userData?.contributions) return [];
    
    // Sort contributions by date
    const sortedContributions = [...userData.contributions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return sortedContributions.map((contribution: MongoContribution): ContributionData => ({
      date: contribution.date,
      count: contribution.count,
      studyCount: contribution.studyCount || 0  // 確保有 studyCount
    }));
  };

  const completeMaterial = async (materialId: string, topicId: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
  
      console.log('Completing material:', { materialId, topicId });
      const updatedUser = await userApi.completeMaterial(user.uid, topicId, materialId);
      setUserData(updatedUser);
    } catch (error) {
      handleApiError(error, 'Failed to complete material');
      throw error;
    }
  };

  const uncompleteMaterial = async (materialId: string, topicId: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const endpoint = `${API_URL}/api/users/${user.uid}/topics/${topicId}/materials/${materialId}/uncomplete`;
      
      const token = await user.getIdToken();
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update material completion status');
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
    } catch (error) {
      console.error('Error uncompleting material:', error);
      throw error;
    }
  };

  const deleteTopic = async (topicId: string): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      
      console.log('Deleting topic:', topicId);
      const updatedUser = await userApi.deleteTopic(user.uid, topicId);
      setUserData(updatedUser);
      return true;
    } catch (error) {
      handleApiError(error, 'Failed to delete topic');
      return false;
    }
  };

  const updateMaterialProgress = async (
    materialId: string,
    topicId: string,
    updates: {
      completedUnits: number;
      completed: boolean;
      readingTime: number;
    }
  ): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      console.log('Updating material progress:', { updates, materialId, topicId });
      const updatedUser = await userApi.updateMaterialProgress(
        user.uid, 
        topicId, 
        materialId, 
        updates
      );
      setUserData(updatedUser);
      return true;
    } catch (error) {
      handleApiError(error, 'Failed to update material progress');
      return false;
    }
  };

  const deleteMaterial = async (materialId: string, topicId: string): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      
      console.log('Deleting material:', { materialId, topicId });
      const updatedUser = await userApi.deleteMaterial(user.uid, topicId, materialId);
      setUserData(updatedUser);
      return true;
    } catch (error) {
      handleApiError(error, 'Failed to delete material');
      return false;
    }
  };

  return {
    userData,
    loading,
    isLoading,
    fetchUserData,
    addMaterial,
    updateProfile,
    updateTopicName,
    addTopic,
    getContributionData,
    completeMaterial,
    uncompleteMaterial,
    deleteTopic,
    updateMaterialProgress,
    deleteMaterial
  };
};