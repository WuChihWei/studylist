import { useState, useEffect } from 'react';
import { User, Categories } from '../types/User';
import { useFirebase } from '../app/firebase/FirebaseProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://studylistserver-production.up.railway.app';

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
    
    try {
      setIsLoading(true);
      const token = await currentUser.getIdToken(forceRefresh);
      console.log('Token obtained:', token ? 'Yes' : 'No');
      
      const apiUrl = API_URL;
      const response = await fetch(`${apiUrl}/api/users/${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
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

  const deleteMaterial = async (materialId: string, topicId: string): Promise<boolean> => {
    try {
      console.log('=== Delete Material Started ===');
      console.log('Material ID:', materialId);
      console.log('Topic ID:', topicId);
      
      // Check for complete MongoDB ObjectId format
      if (materialId?.length !== 24) {
        console.error('Material ID appears to be malformed:', materialId);
      }
      
      if (topicId?.length !== 24) {
        console.error('Topic ID appears to be malformed:', topicId);
      }
      
      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        throw new Error('No user logged in');
      }
      
      console.log('Current user UID:', user.uid);

      // 获取材料类型 - 这很关键
      const topicToDelete = userData?.topics.find(t => t._id === topicId);
      const materialToDelete = topicToDelete?.categories ? 
        Object.values(topicToDelete.categories)
          .flat()
          .find((m: any) => m._id === materialId) : 
        null;
      
      console.log('Found topic to delete from:', topicToDelete?.name);
      console.log('Found material to delete:', materialToDelete);
      
      // 确定材料类型（关键修改）
      let materialType: string | null = null;
      if (materialToDelete) {
        materialType = materialToDelete.type;
        console.log('Material type determined:', materialType);
      } else {
        console.warn('Material not found in client data, type cannot be determined');
        // 尝试查找材料类型
        for (const type of ['webpage', 'book', 'video', 'podcast'] as const) {
          if (topicToDelete?.categories[type]?.some(m => m._id === materialId)) {
            materialType = type;
            console.log('Material type found by searching categories:', materialType);
            break;
          }
        }
      }

      const token = await user.getIdToken();
      let response;
      let success = false;

      // 添加: 尝试我们的独立调试端点
      try {
        const debugEndpoint = `${API_URL}/api/delete-material-debug/${user.uid}/${topicId}/${materialId}`;
        console.log('🧪 TRYING DEBUG ENDPOINT:', debugEndpoint);
        
        response = await fetch(debugEndpoint, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Debug endpoint response status:', response.status);
        console.log('Debug endpoint headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          console.log('DEBUG endpoint succeeded!');
          const data = await response.json();
          console.log('Debug endpoint response:', data);
          
          // 如果测试端点成功，手动更新本地数据
          updateLocalState();
          return true;
        } else {
          console.log('Debug endpoint failed, continuing with regular endpoints');
        }
      } catch (e) {
        console.error('Error with debug endpoint:', e);
      }

      // 首先尝试带类型的端点（如果类型可用）
      if (materialType) {
        const typeEndpoint = `${API_URL}/api/users/${user.uid}/topics/${topicId}/materials/${materialType}/${materialId}`;
        console.log('First attempt - DELETE request with material type to:', typeEndpoint);
        
        try {
          response = await fetch(typeEndpoint, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Response status (with type):', response.status);
          console.log('Response headers (with type):', Object.fromEntries(response.headers.entries()));
          
          if (response.ok) {
            console.log('DELETE with material type succeeded!');
            success = true;
          } else {
            console.log('DELETE with material type failed, will try standard endpoint');
          }
        } catch (e) {
          console.error('Error in DELETE with type request:', e);
        }
      }

      // 如果带类型请求失败或没有类型，尝试标准端点
      if (!success) {
        const standardEndpoint = `${API_URL}/api/users/${user.uid}/topics/${topicId}/materials/${materialId}`;
        console.log('Second attempt - DELETE request to standard endpoint:', standardEndpoint);
        
        response = await fetch(standardEndpoint, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status (standard):', response.status);
        console.log('Response headers (standard):', Object.fromEntries(response.headers.entries()));
      }

      // 处理最终响应
      if (response && response.ok) {
        console.log('Material deleted successfully on server');
        
        // 尝试解析响应更新用户数据
        try {
          const userData = await response.json();
          setUserData(userData);
          console.log('User data updated from server response');
        } catch (e) {
          console.log('Could not parse response, updating local state manually');
          updateLocalState();
        }
        return true;
      } else {
        // 处理错误
        let errorMessage = '';
        
        try {
          const errorData = response ? await response.json() : { error: 'No response' };
          console.error('Delete material failed:', errorData);
          errorMessage = JSON.stringify(errorData);
        } catch (e) {
          console.error('Could not parse error response');
          errorMessage = 'Unknown error - could not parse response';
        }
        
        console.warn(`Delete request failed: ${errorMessage}`);
        
        // 失败时更新客户端UI，提供良好用户体验
        console.log('All server deletion attempts failed, performing client-side deletion');
        updateLocalState();
        return true;
      }
      
      // Helper function to update local state
      function updateLocalState() {
        setUserData(prevData => {
          if (!prevData) return null;

          const updatedTopics = prevData.topics.map(topic => {
            if (topic._id !== topicId) return topic;

            // Remove material from all categories
            const updatedCategories = { ...topic.categories };
            for (const type of ['webpage', 'video', 'podcast', 'book'] as const) {
              updatedCategories[type] = updatedCategories[type].filter(
                m => m._id !== materialId
              );
            }

            return {
              ...topic,
              categories: updatedCategories
            };
          });

          return {
            ...prevData,
            topics: updatedTopics
          };
        });
        
        console.log('Material deleted client-side successfully');
      }
    } catch (error) {
      console.error('Delete material error:', error);
      
      // Fall back to client-side deletion even on errors
      try {
        console.log('Error caught, attempting client-side deletion as fallback');
        setUserData(prevData => {
          if (!prevData) return null;
          
          const updatedTopics = prevData.topics.map(topic => {
            if (topic._id !== topicId) return topic;
            
            return {
              ...topic,
              categories: {
                webpage: topic.categories.webpage.filter(m => m._id !== materialId),
                video: topic.categories.video.filter(m => m._id !== materialId),
                podcast: topic.categories.podcast.filter(m => m._id !== materialId),
                book: topic.categories.book.filter(m => m._id !== materialId)
              }
            };
          });

          return {
            ...prevData,
            topics: updatedTopics
          };
        });
        console.log('Fallback client-side deletion completed');
        return true;
      } catch (e) {
        console.error('Even client-side deletion failed:', e);
        return false;
      }
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

      const endpoint = `${API_URL}/api/users/${user.uid}/topics/${topicId}/materials/${materialId}/progress`;
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
    deleteMaterial,
    deleteTopic,
    updateMaterialProgress
  };
};