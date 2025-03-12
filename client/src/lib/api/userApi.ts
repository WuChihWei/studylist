// 用户API服务 - 处理用户相关的所有API调用
import api from './apiService';
import { User, MaterialInput } from '../../types/User';

// 用户API路径常量
const USERS_ENDPOINT = '/api/users';

// 用户API服务
const userApi = {
  // 获取用户数据
  getUserData: (userId: string) => 
    api.get<User>(`${USERS_ENDPOINT}/${userId}`),
  
  // 更新用户资料
  updateProfile: (userId: string, data: { name: string; bio: string; photoURL?: string }) => 
    api.put<User>(`${USERS_ENDPOINT}/${userId}/profile`, data),
  
  // 创建主题
  createTopic: (userId: string, topicName: string, deadline?: string, tags?: string[]) => 
    api.post<User>(`${USERS_ENDPOINT}/${userId}/topics`, { 
      name: topicName,
      deadline,
      tags
    }),
  
  // 更新主题
  updateTopic: (userId: string, topicId: string, data: { name: string; deadline?: string; tags?: string[] }) => 
    api.put<User>(`${USERS_ENDPOINT}/${userId}/topics/${topicId}`, data),
  
  // 删除主题
  deleteTopic: (userId: string, topicId: string) => 
    api.delete<User>(`${USERS_ENDPOINT}/${userId}/topics/${topicId}`),
  
  // 添加学习材料
  addMaterial: async (userId: string, topicId: string, materialData: MaterialInput) => {
    // 只在開發環境中輸出日誌
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 materialData.favicon:', materialData.favicon);
    }
    
    try {
      const endpoint = `${USERS_ENDPOINT}/${userId}/topics/${topicId}/materials`;
      console.log('🔌 API 請求 URL:', endpoint);
      console.log('🔌 請求數據:', materialData);
      
      const data = await api.post<User>(endpoint, materialData);
      console.log('🔌 API 響應數據:', data);
      
      return data;
    } catch (error) {
      console.error('🔌 API 請求錯誤:', error);
      throw error;
    }
  },
  
  // 更新材料完成状态
  completeMaterial: (userId: string, topicId: string, materialId: string) => 
    api.put<User>(`${USERS_ENDPOINT}/${userId}/topics/${topicId}/materials/${materialId}/complete`),
  
  // 更新材料进度
  updateMaterialProgress: (userId: string, topicId: string, materialId: string, updates: {
    completedUnits: number;
    completed: boolean;
    readingTime: number;
  }) => 
    api.put<User>(`${USERS_ENDPOINT}/${userId}/topics/${topicId}/materials/${materialId}/progress`, updates),
  
  // 删除材料
  deleteMaterial: (userId: string, topicId: string, materialId: string) => 
    api.delete<User>(`${USERS_ENDPOINT}/${userId}/topics/${topicId}/materials/${materialId}`),
  
  // 保存學習路徑
  saveLearningPath: (userId: string, topicId: string, data: { nodes: any[], edges: any[] }) => 
    api.post<User>(`${USERS_ENDPOINT}/${userId}/topics/${topicId}/learning-path`, data),
  
  // 獲取學習路徑
  getLearningPath: (userId: string, topicId: string) => 
    api.get<{ learningPath: { nodes: any[], edges: any[] } }>(`${USERS_ENDPOINT}/${userId}/topics/${topicId}/learning-path`),
};

export default userApi;