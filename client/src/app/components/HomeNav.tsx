'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { IoIosArrowDown } from "react-icons/io";
import { auth } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';

const HomeNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { userData } = useUserData();
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/signup');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userData');
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="container mx-auto">
        <div className="flex h-14 items-center px-4 sm:px-6">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-6 w-6 bg-black rounded flex items-center justify-center">
                <span className="text-white text-sm font-medium">S</span>
              </div>
              <span className="text-base font-medium text-gray-900">StudyList</span>
            </Link>
          </div>

          {/* Center Navigation */}
          {pathname === '/' && (
            <div className="hidden md:flex flex-1 justify-center">
              <div className="flex items-center space-x-1">
                <Link href="#features" className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                  Pricing
                </Link>
                <Link href="#about" className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                  About
                </Link>
              </div>
            </div>
          )}

          {/* Auth Buttons or User Menu */}
          <div className="flex items-center space-x-2 ml-auto">
            {userData ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  <span className="font-medium">Hi, {userData.name || 'User'}</span>
                  <IoIosArrowDown className="w-4 h-4 text-gray-600" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={() => router.push('/database')}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              !isAuthPage && (
                <>
                  <Link 
                    href="/login" 
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Log in
                  </Link>
                  <Link 
                    href="/signup" 
                    className="px-3 py-1.5 text-sm text-white bg-black hover:bg-gray-800 rounded-md transition-colors"
                  >
                    Get StudyList free
                  </Link>
                </>
              )
            )}
            {isAuthPage && (
              <Link 
                href="/" 
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Back to home
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default HomeNav; 