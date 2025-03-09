'use client';

import React, { useState, useEffect } from 'react';
import { useViewMode } from '@/hooks/useViewMode';
import { useUserData } from '@/hooks/useUserData';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Database, ChevronDown, ChevronRight } from 'lucide-react';

// Import components directly to avoid linter errors
import SidebarHeader from './SidebarHeader';
import SidebarToggle from './SidebarToggle';
import SidebarFooter from './SidebarFooter';

export default function Sidebar() {
  const { userData } = useUserData();
  const { viewMode, setViewMode } = useViewMode();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTopicId = searchParams?.get('topic');
  
  // Determine if we're on the database page
  const isDatabasePage = pathname?.startsWith('/database') || pathname === '/';
  
  // Handler for topic selection from sidebar
  const handleTopicSelect = (topicId: string) => {
    const mode = viewMode === 'path' ? 'path' : 'list';
    router.push(`/database?topic=${topicId}&mode=${mode}`);
  };
  
  // Handler for navigating to database page
  const handleDatabaseClick = () => {
    router.push('/database');
  };
  
  return (
    <div className="w-64 h-screen flex flex-col bg-white border-r border-gray-200 shadow-sm">
      <SidebarHeader />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Database header */}
        <div className="px-4 py-3">
          <div className="text-sm font-semibold text-gray-800">Database</div>
        </div>
        
        {/* List/Path toggle */}
        <div className="px-3 mb-2">
          <SidebarToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
        
        {/* Topics list */}
        <div className="px-2 py-1">
          {userData?.topics && userData.topics.length > 0 ? (
            <div className="space-y-0.5">
              {userData.topics.map((topic) => (
                <button
                  key={topic._id || 'unknown'}
                  className={`
                    flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-left
                    ${currentTopicId === topic._id 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'}
                  `}
                  onClick={() => handleTopicSelect(topic._id || '')}
                >
                  <div className="flex-shrink-0 w-5 h-5 mr-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="2" className={currentTopicId === topic._id ? "stroke-blue-700" : "stroke-gray-400"} strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="truncate">{topic.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No topics yet
            </div>
          )}
          
          <button
            className="flex items-center w-full px-3 py-2 mt-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            onClick={() => router.push('/database/add-topic')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Add Topic</span>
          </button>
        </div>
        
        <div className="mt-auto">
          {userData && (
            <div className="px-3 py-3 mx-3 my-1 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {userData.photoURL ? (
                    <img
                      className="h-9 w-9 rounded-full"
                      src={userData.photoURL}
                      alt={userData.name || 'User'}
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-800 font-medium text-sm">
                        {userData.name?.substring(0, 1) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userData.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold">
                      {userData?.contributions?.reduce((total, item) => total + (item.count || 0), 0) || 0}
                    </span> contribution mins
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <SidebarFooter />
    </div>
  );
} 