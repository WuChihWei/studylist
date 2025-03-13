'use client';

import React, { useState, useEffect } from 'react';
import { useViewMode } from '@/hooks/useViewMode';
import { useUserData } from '@/hooks/useUserData';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Database, ChevronDown, ChevronRight, List, GitBranch, Menu, X } from 'lucide-react';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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

  // Get mode-specific styles and icons
  const getModeSpecificStyles = () => {
    return {
      sidebarClass: viewMode === 'path' 
        ? 'bg-gradient-to-b from-blue-50 to-white border-r border-blue-100' 
        : 'bg-white border-r border-gray-200',
      headerClass: viewMode === 'path'
        ? 'text-blue-800 font-semibold'
        : 'text-gray-800 font-semibold',
      icon: viewMode === 'path' ? <GitBranch size={16} className="mr-2 text-blue-600" /> : <List size={16} className="mr-2 text-gray-600" />
    };
  };

  const modeStyles = getModeSpecificStyles();
  
  return (
    <>
      {/* Hamburger Menu Button - Only visible on mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? (
          <X size={24} className="text-gray-600" />
        ) : (
          <Menu size={24} className="text-gray-600" />
        )}
      </button>

      {/* Overlay for mobile - Only visible when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        w-64 h-screen flex flex-col shadow-sm ${modeStyles.sidebarClass}
      `}>
        <SidebarHeader />
        
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Database header with mode indicator */}
          <div className="px-4 py-3 flex items-center">
            <div className={`text-sm ${modeStyles.headerClass} flex items-center`}>
              {modeStyles.icon}
              <span>Database</span>
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-opacity-80 font-medium" 
                    style={{ 
                      backgroundColor: viewMode === 'path' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(229, 231, 235, 0.5)',
                      color: viewMode === 'path' ? '#3b82f6' : '#6b7280'
                    }}>
                {viewMode === 'path' ? 'Path View' : 'List View'}
              </span>
            </div>
          </div>
          
          {/* List/Path toggle */}
          <div className="px-3 mb-2">
            <SidebarToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
          
          {/* Topics list with mode-specific styling */}
          <div className="px-2 py-1">
            {userData?.topics && userData.topics.length > 0 ? (
              <div className="space-y-0.5">
                {/* All topics option */}
                <button
                  className={`
                    flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-left
                    ${!currentTopicId 
                      ? viewMode === 'path'
                        ? 'bg-blue-100 text-blue-800 font-medium' 
                        : 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'}
                  `}
                  onClick={() => {
                    const mode = viewMode === 'path' ? 'path' : 'list';
                    router.push(`/database?mode=${mode}`);
                  }}
                >
                  <div className="flex-shrink-0 w-5 h-5 mr-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect 
                        x="3" 
                        y="3" 
                        width="18" 
                        height="18" 
                        rx="2" 
                        className={!currentTopicId 
                          ? viewMode === 'path' 
                            ? "stroke-blue-800" 
                            : "stroke-blue-700" 
                          : "stroke-gray-400"} 
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <span className="truncate">All Topics</span>
                </button>
                {userData.topics.map((topic) => (
                  <button
                    key={topic._id || 'unknown'}
                    className={`
                      flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-left
                      ${currentTopicId === topic._id 
                        ? viewMode === 'path'
                          ? 'bg-blue-100 text-blue-800 font-medium' 
                          : 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'}
                    `}
                    onClick={() => handleTopicSelect(topic._id || '')}
                  >
                    <div className="flex-shrink-0 w-5 h-5 mr-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect 
                          x="3" 
                          y="3" 
                          width="18" 
                          height="18" 
                          rx="2" 
                          className={currentTopicId === topic._id 
                            ? viewMode === 'path' 
                              ? "stroke-blue-800" 
                              : "stroke-blue-700" 
                            : "stroke-gray-400"} 
                          strokeWidth="2"
                        />
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
              className={`
                flex items-center w-full px-3 py-2 mt-2 text-sm rounded-md
                ${viewMode === 'path' 
                  ? 'text-blue-600 hover:bg-blue-50' 
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
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
              <div className={`px-3 py-3 mx-3 my-1 rounded-lg ${viewMode === 'path' ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {userData.photoURL ? (
                      <img
                        className="h-9 w-9 rounded-full"
                        src={userData.photoURL}
                        alt={userData.name || 'User'}
                      />
                    ) : (
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${viewMode === 'path' ? 'bg-blue-200' : 'bg-blue-100'}`}>
                        <span className={`${viewMode === 'path' ? 'text-blue-900' : 'text-blue-800'} font-medium text-sm`}>
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
    </>
  );
} 