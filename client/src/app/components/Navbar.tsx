'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/signup');
  const isHomePage = pathname === '/';

  return (
    <nav className="bg-white border-b border-gray-200">
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
          {isHomePage && (
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

          {/* Auth Buttons */}
          <div className="flex items-center space-x-2">
            {isAuthPage ? (
              <Link 
                href="/" 
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Back to home
              </Link>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 