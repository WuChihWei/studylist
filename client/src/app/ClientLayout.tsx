'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { FirebaseProvider } from './firebase/FirebaseProvider';

// Use dynamic import with no SSR to avoid hydration errors
const Sidebar = dynamic(() => import('./components/sidebar/Sidebar'), { 
  ssr: false,
  loading: () => <div className="w-64 h-screen bg-white border-r border-gray-200" />
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </FirebaseProvider>
  );
} 