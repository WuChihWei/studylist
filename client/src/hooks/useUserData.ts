import { useState, useEffect } from 'react';
import { User, Categories } from '../types/User';
import { useFirebase } from '../app/firebase/FirebaseProvider';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://studylistserver-production.up.railway.app').replace(/\/+$/, '');

type MaterialType = 'webpage' | 'book' | 'video' | 'podcast';

interface MaterialPayload {
  type: MaterialType;
  title: string;
  url: string | null;
  rating: number;
  dateAdded: string;
}

interface MaterialInput {
  type: MaterialType;
  title: string;
  url?: string;
  rating?: number;
  dateAdded?: Date;
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
    console.log('使用API URL:', API_URL);
    
    try {
      setIsLoading(true);
      const token = await currentUser.getIdToken(forceRefresh);
      console.log('Token obtained:', token ? 'Yes' : 'No');
      
      const response = await fetch(`${API_URL}/api/users/${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received user data:', data);
      setUserData(data);
    } catch (error) {
      console.error('Error in fetchUserData:', error);
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
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const endpoint = `${API_URL}/api/users/${user.uid}/topics/${topicId}/materials`;
      
      console.log('Adding material:', {
        payload: materialData,
        topicId,
        url: endpoint
      });

      const token = await user.getIdToken();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(materialData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Failed to add material: ${response.status}`);
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
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

      const token = await user.getIdToken();
      
      console.log('Updating profile with data:', data);
      console.log('Sending request to:', `${API_URL}/api/users/${user.uid}/profile`);
      
      const response = await fetch(
        `${API_URL}/api/users/${user.uid}/profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const updatedUser = await response.json();
      console.log('Updated user data:', updatedUser);
      setUserData(updatedUser);
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
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
  
      const endpoint = `${API_URL}/api/users/${user.uid}/topics/${topicId}/materials/${materialId}/complete`;
      
      console.log('Sending complete request to:', endpoint);
      
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
        console.error('Complete material error response:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to update material completion status');
      }
  
      const updatedUser = await response.json();
      setUserData(updatedUser);
    } catch (error) {
      console.error('Error completing material:', error);
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

      const token = await user.getIdToken();
      const response = await fetch(
        `${API_URL}/api/users/${user.uid}/topics/${topicId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete topic failed:', errorData);
        return false;
      }

      // Update local state
      setUserData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          topics: prevData.topics.filter(topic => topic._id !== topicId)
        };
      });

      return true;
    } catch (error) {
      console.error('Delete topic error:', error);
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

      // Use the simplified API route
      const endpoint = `${API_URL}/api/materials/${materialId}/progress?userId=${user.uid}&topicId=${topicId}`;
      const token = await user.getIdToken();
      
      console.log('Updating material progress:', {
        endpoint,
        updates,
        materialId,
        topicId
      });

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update progress error:', errorText);
        throw new Error(`Failed to update progress: ${response.status}`);
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
      return true;
    } catch (error) {
      console.error('Error updating material progress:', error);
      return false;
    }
  };

  const deleteMaterial = async (materialId: string, topicId: string): Promise<boolean> => {
    try {
      console.log('🗑️ 开始删除材料');
      console.log('材料ID:', materialId);
      console.log('主题ID:', topicId);
      
      const user = auth.currentUser;
      if (!user) {
        console.error('未登录用户');
        throw new Error('未登录用户');
      }
      
      console.log('用户ID:', user.uid);
      
      // 先执行本地状态更新，确保UI立即响应
      updateLocalState();
      
      // 恢复服务器请求
      const token = await user.getIdToken();
      
      // 使用新的简化端点进行删除
      const endpoint = `${API_URL}/api/materials/${materialId}?userId=${user.uid}&topicId=${topicId}`;
      console.log('发送删除请求到:', endpoint);
      
      // 使用DELETE请求
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('响应状态:', response.status);
      
      if (response.ok) {
        console.log('服务器删除成功');
        const updatedUser = await response.json();
        setUserData(updatedUser);
        return true;
      } else {
        // 服务器删除失败，但UI已更新
        console.error('服务器删除失败:', response.status);
        const errorText = await response.text();
        console.error('错误响应:', errorText);
        
        // 虽然本地已删除，但返回错误状态让调用方知道服务器操作失败
        return false;
      }
    } catch (error) {
      console.error('删除材料错误:', error);
      
      // 出错时仍更新本地状态以保持UI响应
      updateLocalState();
      
      // 返回false表示操作未完全成功
      return false;
    }
    
    // 更新本地状态函数
    function updateLocalState() {
      console.log('执行本地状态更新');
      setUserData(prevData => {
        if (!prevData) return null;
        
        const updatedTopics = prevData.topics.map(topic => {
          if (topic._id !== topicId) return topic;
          
          // 创建不包含被删除材料的更新分类
          const updatedCategories = { ...topic.categories };
          for (const type of ['webpage', 'video', 'podcast', 'book'] as const) {
            updatedCategories[type] = updatedCategories[type].filter(m => m._id !== materialId);
          }
          
          return { ...topic, categories: updatedCategories };
        });
        
        return { ...prevData, topics: updatedTopics };
      });
    }
  };

  return { 
    userData, 
    loading, 
    fetchUserData, 
    addMaterial,
    updateProfile,
    addTopic,
    updateTopicName,
    getContributionData,
    completeMaterial,
    uncompleteMaterial,
    deleteTopic,
    updateMaterialProgress,
    deleteMaterial
  };
};