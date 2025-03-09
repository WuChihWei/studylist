// API服务 - 集中管理所有API调用
import { getAuth } from 'firebase/auth';

// 统一API URL配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

// API错误类，用于统一错误处理
export class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// 请求配置接口
interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
  params?: Record<string, string>;
}

// 构建URL，支持查询参数
const buildUrl = (endpoint: string, params?: Record<string, string>): string => {
  // 确保endpoint以/开头，但不以//开头
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${API_BASE_URL}${normalizedEndpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }
  
  return url.toString();
};

// 核心请求方法
const request = async <T>(
  endpoint: string, 
  config: RequestConfig = {}
): Promise<T> => {
  try {
    const { requiresAuth = true, params, ...fetchConfig } = config;
    
    // 合并请求配置
    const mergedConfig: RequestInit = {
      ...fetchConfig,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'include',
    };
    
    // 添加认证头
    if (requiresAuth) {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new ApiError('Authentication required', 401);
      }
      
      const token = await user.getIdToken(true);
      mergedConfig.headers = {
        ...mergedConfig.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    
    // 执行请求
    console.log(`API Request: ${endpoint}`, { config: mergedConfig });
    
    // 加入请求日志，用于调试
    console.log(`
        
        
       ${mergedConfig.method || 'GET'} ${buildUrl(endpoint, params)}`);
    
    const response = await fetch(buildUrl(endpoint, params), mergedConfig);
    
    // 处理响应
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      
      // 特殊處理 404 錯誤，尤其是對於學習路徑的請求
      if (response.status === 404) {
        console.warn(`Resource not found: ${endpoint}`);
        
        // 對於學習路徑請求，返回空的學習路徑而不是拋出錯誤
        if (endpoint.includes('learning-path')) {
          return { learningPath: { nodes: [], edges: [] } } as T;
        }
      }
      
      throw new ApiError(
        errorData?.message || `API error: ${response.status}`,
        response.status,
        errorData
      );
    }
    
    // 检查是否有响应内容
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return {} as T;
  } catch (error) {
    // 统一处理错误
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('API Request failed:', error);
    throw new ApiError(`API request failed: ${error.message}`, 500);
  }
};

// 导出API方法
const api = {
  get: <T>(endpoint: string, config?: RequestConfig) => 
    request<T>(endpoint, { method: 'GET', ...config }),
    
  post: <T>(endpoint: string, data?: any, config?: RequestConfig) => 
    request<T>(endpoint, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined,
      ...config 
    }),
    
  put: <T>(endpoint: string, data?: any, config?: RequestConfig) => 
    request<T>(endpoint, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined,
      ...config 
    }),
    
  delete: <T>(endpoint: string, config?: RequestConfig) => 
    request<T>(endpoint, { method: 'DELETE', ...config }),
};

export default api;