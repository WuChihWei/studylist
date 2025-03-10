import { useState, useEffect, useCallback } from 'react';
import { User, Topic, Material, EnhancedUser, MaterialPayload, MaterialInput } from '@/types/User';
import { useFirebase } from '../app/firebase/FirebaseProvider';
import userApi from '../lib/api/userApi';
import { handleApiError } from '../lib/api/errorHandler';
import { toast } from 'sonner';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001').replace(/\/+$/, '');

type MaterialType = 'webpage' | 'book' | 'video' | 'podcast';

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

export function useUserData() {
  const { auth } = useFirebase();
  const [userData, setUserData] = useState<EnhancedUser | null>(null);
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
      updateUserData(data);
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

  const transformToEnhancedUser = (user: User): EnhancedUser => {
    return {
      ...user,
      materials: user.materials || [],
      topics: user.topics || []
    };
  };

  const updateUserData = (user: User | null) => {
    if (user) {
      setUserData(transformToEnhancedUser(user));
    } else {
      setUserData(null);
    }
  };

  const addMaterial = async (material: MaterialPayload, topicId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const materialInput: MaterialInput = {
        ...material,
        url: material.url || undefined
      };
      
      const updatedUser = await userApi.addMaterial(user.uid, topicId, materialInput);
      if (!updatedUser) throw new Error('Failed to add material');
      
      updateUserData(updatedUser);
      return true;
    } catch (error) {
      console.error('Error adding material:', error);
      return false;
    }
  };

  const updateProfile = async (data: { name: string; bio: string; photoURL?: string }) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      
      console.log('Updating profile with data:', data);
      const updatedUser = await userApi.updateProfile(user.uid, data);
      updateUserData(updatedUser);
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
      updateUserData(updatedUser);
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
      updateUserData(updatedUser);
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
      updateUserData(updatedUser);
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
      updateUserData(updatedUser);
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
      updateUserData(updatedUser);
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
      updateUserData(updatedUser);
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

      const updatedUser = await userApi.deleteMaterial(user.uid, topicId, materialId);
      if (!updatedUser) throw new Error('Failed to delete material');

      updateUserData(updatedUser);
      return true;
    } catch (error) {
      console.error('Error deleting material:', error);
      return false;
    }
  };

  // Create a separate function for updating state with a callback
  const updateStateWithCallback = (callback: (prevData: EnhancedUser | null) => EnhancedUser | null) => {
    setUserData(callback);
  };

  // Update local data for learning path
  const updateLearningPathLocally = (topicId: string, nodes: any[], edges: any[]) => {
    updateStateWithCallback((prevData) => {
      if (!prevData) return prevData;
      
      const updatedTopics = prevData.topics.map(topic => {
        if (topic._id === topicId) {
          return {
            ...topic,
            learningPath: { nodes, edges }
          };
        }
        return topic;
      });
      
      return {
        ...prevData,
        topics: updatedTopics
      };
    });
  }

  // Update saveLearningPath to use the new function
  const saveLearningPath = async (topicId: string, nodes: any[], edges: any[]): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      await userApi.saveLearningPath(user.uid, topicId, { nodes, edges });
      
      // Update local data using the new function
      updateLearningPathLocally(topicId, nodes, edges);
      
      return true;
    } catch (error) {
      handleApiError(error, 'Failed to save learning path');
      return false;
    }
  };

  // getLearningPath function
  const getLearningPath = async (topicId: string): Promise<{ nodes: any[], edges: any[] }> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }
      
      const response = await userApi.getLearningPath(user.uid, topicId);
      // Fix the response handling based on actual API structure
      if (response && response.learningPath) {
        return {
          nodes: response.learningPath.nodes || [],
          edges: response.learningPath.edges || []
        };
      }
      // Return default empty structure if no learning path
      return { nodes: [], edges: [] };
    } catch (error) {
      // 记录错误但不向用户显示
      console.error('Failed to get learning path:', error);
      // 出错时返回空数组
      return { nodes: [], edges: [] };
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
    deleteMaterial,
    saveLearningPath,
    getLearningPath
  };
}