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
  createTopic: (userId: string, topicName: string) => 
    api.post<User>(`${USERS_ENDPOINT}/${userId}/topics`, { name: topicName }),
  
  // 更新主题名称
  updateTopicTitle: (userId: string, topicId: string, title: string) => 
    api.put<User>(`${USERS_ENDPOINT}/${userId}/topics/${topicId}`, { name: title }),
  
  // 删除主题
  deleteTopic: (userId: string, topicId: string) => 
    api.delete<User>(`${USERS_ENDPOINT}/${userId}/topics/${topicId}`),
  
  // 添加学习材料
  addMaterial: (userId: string, topicId: string, materialData: MaterialInput) => 
    api.post<User>(`${USERS_ENDPOINT}/${userId}/topics/${topicId}/materials`, materialData),
  
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
};

export default userApi;