"use client";

import React, { useEffect, useState } from "react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  useEffect(() => {
    // Check initial state from cookie
    const checkSidebarState = () => {
      const cookies = document.cookie.split(';');
      const sidebarCookie = cookies.find(cookie => cookie.trim().startsWith('sidebar_state='));
      if (sidebarCookie) {
        const sidebarState = sidebarCookie.split('=')[1];
        setSidebarCollapsed(sidebarState === 'false');
      }
    };
    
    checkSidebarState();
    
    // Listen for cookie changes
    const handleStorageChange = () => {
      checkSidebarState();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return (
    <div className="flex h-screen w-full">
      {children}
    </div>
  );
} 