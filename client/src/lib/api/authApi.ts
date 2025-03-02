// 认证API服务 - 处理身份验证相关操作
import api from './apiService';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  getAuth
} from 'firebase/auth';

const authApi = {
  // 邮箱登录
  loginWithEmail: async (email: string, password: string) => {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },
  
  // 邮箱注册
  registerWithEmail: async (email: string, password: string) => {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },
  
  // Google登录
  loginWithGoogle: async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  },
  
  // Facebook登录
  loginWithFacebook: async () => {
    const auth = getAuth();
    const provider = new FacebookAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  },
  
  // 登出
  logout: async () => {
    const auth = getAuth();
    await signOut(auth);
  },
  
  // 创建用户账户（服务器端）
  createUserAccount: async (userData: {
    firebaseUID: string;
    name: string;
    email: string;
    photoURL?: string;
  }) => {
    return api.post('/api/users', userData, { requiresAuth: true });
  }
};

export default authApi;