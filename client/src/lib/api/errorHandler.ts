// 错误处理器
import { ApiError } from './apiService';
import { toast } from 'react-hot-toast'; // 假设使用toast库做通知

// 错误类型
export type ErrorType = 'auth' | 'network' | 'server' | 'validation' | 'notFound' | 'unknown';

// 错误处理选项
export interface ErrorHandlerOptions {
  showToast?: boolean;
  redirectOnAuthError?: boolean;
  logToConsole?: boolean;
}

// 默认选项
const defaultOptions: ErrorHandlerOptions = {
  showToast: true,
  redirectOnAuthError: true,
  logToConsole: true,
};

// 处理API错误
export const handleApiError = (
  error: any, 
  customMessage?: string,
  options: ErrorHandlerOptions = {}
): { message: string; type: ErrorType } => {
  const opts = { ...defaultOptions, ...options };
  let message = customMessage || 'An error occurred';
  let type: ErrorType = 'unknown';
  
  // 详细控制台日志
  if (opts.logToConsole) {
    console.error('API Error:', error);
  }
  
  // 处理API错误类型
  if (error instanceof ApiError) {
    // 根据状态码分类错误
    switch (error.status) {
      case 400:
        type = 'validation';
        message = error.message || 'Invalid request data';
        break;
      case 401:
      case 403:
        type = 'auth';
        message = error.message || 'Authentication error';
        // 认证错误可选重定向到登录页
        if (opts.redirectOnAuthError && typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
        break;
      case 404:
        type = 'notFound';
        message = error.message || 'Resource not found';
        break;
      case 500:
      case 502:
      case 503:
        type = 'server';
        message = error.message || 'Server error';
        break;
      default:
        type = 'unknown';
        message = error.message || 'Unknown error';
    }
  } else if (error instanceof Error) {
    // 网络错误或其他JS错误
    if (error.message.includes('NetworkError') || error.message.includes('network')) {
      type = 'network';
      message = 'Network connection error';
    } else {
      message = error.message || 'An unexpected error occurred';
    }
  }
  
  // 使用toast通知
  if (opts.showToast) {
    toast.error(message);
  }
  
  return { message, type };
};