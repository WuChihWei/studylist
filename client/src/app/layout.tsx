'use client';

import React, { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';
import { FirebaseProvider } from './firebase/FirebaseProvider';

// Use dynamic import with no SSR to avoid hydration errors
const Sidebar = dynamic(() => import('./components/sidebar/Sidebar'), { 
  ssr: false,
  loading: () => <div className="w-64 h-screen bg-white border-r border-gray-200" />
});

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use client-side only rendering for the main layout
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null; // Return null on server-side
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <FirebaseProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </FirebaseProvider>
      </body>
    </html>
  );
}
