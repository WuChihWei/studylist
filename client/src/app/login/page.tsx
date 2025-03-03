"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import Link from 'next/link';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/app/components/ui/card";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import userApi from '@/lib/api/userApi';
import { handleApiError } from '@/lib/api/errorHandler';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check local storage for login state
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Firebase登录
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 使用API服务获取用户数据
      const userData = await userApi.getUserData(userCredential.user.uid);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // 设置登录状态
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      
      // 显示成功消息并跳转
      setShowPopup(true);
      setTimeout(() => {
        router.push('/profile');
      }, 1000);

    } catch (error) {
      const { message } = handleApiError(error, 'Login failed');
      setError(message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      localStorage.removeItem('isLoggedIn'); // Clear login state
      console.log("User logged out");
    } catch (error: any) {
      console.error("Error logging out:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      console.log('Google auth successful');
      
      const token = await userCredential.user.getIdToken(true);
      console.log('Token obtained (first few chars):', token ? token.substring(0, 10) + '...' : 'No token');
      
      const apiUrl = 'http://localhost:4001';
      const requestUrl = `${apiUrl}/api/users/${userCredential.user.uid}`;
      console.log('Making request to:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });
      
      // Add more detailed logging
      console.log('Request details:', {
        url: requestUrl,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer [TOKEN]',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Full response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log('Login successful, received user data:', userData);
      
      localStorage.setItem('userData', JSON.stringify(userData));
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      setShowPopup(true);
      router.push('/profile');
    } catch (error: any) {
      console.error("Google login error:", error);
      setError(error.message || 'An error occurred during Google login');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      console.log('Facebook auth successful');
      
      const token = await userCredential.user.getIdToken(true);
      console.log('Token obtained (first few chars):', token ? token.substring(0, 10) + '...' : 'No token');
      
      const apiUrl = 'http://localhost:4001';
      const requestUrl = `${apiUrl}/api/users/${userCredential.user.uid}`;
      console.log('Making request to:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });
      
      // Add more detailed logging
      console.log('Request details:', {
        url: requestUrl,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer [TOKEN]',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Full response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log('Login successful, received user data:', userData);
      
      localStorage.setItem('userData', JSON.stringify(userData));
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      setShowPopup(true);
      router.push('/profile');
    } catch (error: any) {
      console.error("Facebook login error:", error);
      setError(error.message || 'An error occurred during Facebook login');
    }
  };

  return (
    <div className="flex md:flex-row min-h-screen">
      {/* 左側區塊 - 在手機版時隱藏 */}
      <div className="hidden md:flex md:flex-1 bg-gradient-to-b from-[#88bbfe] via-[#8686ff] to-[#050561] p-8 md:p-16 flex-col justify-center text-white">
        <h1 className="text-3xl md:text-5xl mb-4">Learn With Your Role Models</h1>
        <p className="text-lg md:text-xl">To create the most motivating learning methods</p>
      </div>
      
      {/* 右側登入區塊 - 在手機版時佔滿寬度 */}
      <div className="flex-1 w-full p-4 md:p-16 flex justify-center items-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            {/* 在手機版時顯示標題 */}
            <div className="md:hidden mb-6">
              <h1 className="text-2xl font-bold text-center">Learn With Your Role Models</h1>
              <p className="text-center text-muted-foreground">To create the most motivating learning methods</p>
            </div>
            <CardTitle className="text-2xl">Hello Again!</CardTitle>
            <CardDescription>Welcome back to your study journey</CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!isLoggedIn ? (
              <div className="space-y-4">
                <Button 
                  onClick={handleGoogleLogin} 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </Button>

                <Button 
                  onClick={handleFacebookLogin} 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
                  </svg>
                  Sign in with Facebook
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or continue with</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </div>
            ) : (
              <Button onClick={handleLogout} variant="secondary" className="w-full">
                Logout
              </Button>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Link href="#forgot-password" className="text-sm text-muted-foreground hover:text-primary">
              Forgot Password?
            </Link>
            <Link href="/signup" className="text-sm text-muted-foreground hover:text-primary">
              Don't have an account? Sign up
            </Link>
          </CardFooter>
        </Card>
        
        {showPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <Card className="w-[350px]">
              <CardContent className="pt-6">
                <p className="text-center mb-4">Login successful!</p>
                <Button onClick={() => {
                  setShowPopup(false);
                  router.push('/profile');
                }} className="w-full">
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;