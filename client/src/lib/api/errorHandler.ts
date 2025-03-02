// 错误处理器
import { ApiError } from './apiService';
import toast from 'react-hot-toast'; // 使用已安装的 react-hot-toast

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

// 简单的通知函数，可以替换为您现有的通知系统
const showNotification = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
  // 控制台输出
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // 这里可以添加您自己的通知机制
  // 例如使用浏览器原生API
  if (typeof window !== 'undefined') {
    // 使用原生alert (不推荐用于生产环境)
    // alert(`${type.toUpperCase()}: ${message}`);
    
    // 或者创建一个临时DOM元素显示通知
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '16px';
    notification.style.right = '16px';
    notification.style.padding = '12px 24px';
    notification.style.borderRadius = '4px';
    notification.style.backgroundColor = type === 'error' ? '#f44336' : '#4caf50';
    notification.style.color = 'white';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
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
  
  // 使用 react-hot-toast 显示错误
  if (opts.showToast) {
    toast.error(message);
  }
  
  return { message, type };
};