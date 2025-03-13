'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { useViewMode } from '@/hooks/useViewMode';
import { Material, MaterialPayload, Topic } from '@/types/User';
import { Plus, ChevronLeft } from 'lucide-react';
import { MdKeyboardArrowRight } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";
import { Button } from '@/app/components/ui/button';
import PathView from './PathView';
import ListLayout from './ListLayout';
import AddNewMaterial from '../components/AddNewMaterial';
import { ViewMode } from '@/types/ViewMode';
import ContributionGraph from '../components/ContributionGraph';
import { auth } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';

export default function DatabasePage() {
  const { userData, addMaterial, deleteMaterial, completeMaterial, uncompleteMaterial, updateMaterialProgress } = useUserData();
  const { viewMode: globalViewMode } = useViewMode();
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams?.get('topic');
  const modeParam = searchParams?.get('mode');
  const mode = modeParam === 'list' || modeParam === 'path' ? modeParam as ViewMode : undefined;
  
  const [currentTopic, setCurrentTopic] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [showAddNewMaterial, setShowAddNewMaterial] = useState(false);
  const [unitMinutes, setUnitMinutes] = useState(20);
  const [listSubMode, setListSubMode] = useState<'list' | 'grid'>('list');
  const [reorderCounter, setReorderCounter] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryFilters, setCategoryFilters] = useState({
    web: true,
    video: true,
    podcast: true,
    book: true
  });

  // 使用 mode 或 globalViewMode 作为当前模式
  const currentMode: ViewMode = mode || globalViewMode;
  
  // Effect to fetch topic data when the topicId changes
  useEffect(() => {
    if (userData && topicId) {
      const topic = userData.topics?.find((t) => t._id === topicId);
      
      if (topic) {
        setCurrentTopic(topic);
        
        // Extract materials from topic
        let topicMaterials: any[] = [];
        
        if (topic.materials && topic.materials.length > 0) {
          topicMaterials = [...topic.materials];
        } 
        else if (topic.categories) {
          topicMaterials = [
            ...(topic.categories.webpage || []).map(m => ({ ...m, type: 'webpage' as const })),
            ...(topic.categories.video || []).map(m => ({ ...m, type: 'video' as const })),
            ...(topic.categories.podcast || []).map(m => ({ ...m, type: 'podcast' as const })),
            ...(topic.categories.book || []).map(m => ({ ...m, type: 'book' as const }))
          ];
        }
        
        const materialsWithIndex = topicMaterials.map((material, index) => ({
          ...material,
          index: index + 1,
          order: material.order || index
        })).sort((a, b) => (a.order || 0) - (b.order || 0));
        
        setMaterials(materialsWithIndex);
      }
    } else {
      setCurrentTopic(null);
      setMaterials([]);
    }
  }, [userData, topicId]);
  
  // Handle add material
  const handleAddMaterial = (materialData: {
    title: string;
    type: string;
    url: string | null;
    favicon?: string | null;
  }) => {
    if (!topicId) return;
    
    const payload: MaterialPayload = {
      title: materialData.title,
      type: materialData.type as 'webpage' | 'video' | 'book' | 'podcast',
      url: materialData.url,
      favicon: materialData.favicon || undefined,
      rating: 1,
      dateAdded: new Date().toISOString(),
      order: materials.length + 1,
    };
    
    addMaterial(payload, topicId);
  };
  
  // Handle delete material
  const handleDeleteMaterial = async (materialId: string) => {
    if (!topicId) return false;
    try {
      return await deleteMaterial(materialId, topicId);
    } catch (error) {
      console.error('Failed to delete material:', error);
      return false;
    }
  };
  
  // Handle toggle completion
  const handleToggleCompletion = async (materialId: string, isCompleted: boolean) => {
    if (!topicId) return;
    try {
      if (isCompleted) {
        await uncompleteMaterial(materialId, topicId);
      } else {
        await completeMaterial(materialId, topicId);
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };
  
  // Handle update material progress
  const handleUpdateProgress = async (materialId: string, completed: number, total: number) => {
    if (!topicId) return false;
    
    try {
      const updates = {
        completedUnits: completed,
        completed: completed >= total,
        readingTime: total
      };
      
      return await updateMaterialProgress(materialId, topicId, updates);
    } catch (error) {
      console.error('Error updating progress:', error);
      return false;
    }
  };
  
  // Handle topic navigation
  const handleTopicChange = (id: string) => {
    router.push(`/database?topic=${id}&mode=${currentMode}`);
  };
  
  // Handle reorder materials
  const handleReorderMaterials = async (reorderedItems: Material[]) => {
    const itemsWithOrder = reorderedItems.map((item, idx) => ({
      ...item,
      order: idx
    }));
    
    setMaterials(itemsWithOrder);
    setReorderCounter(prev => prev + 1);
    
    try {
      const orderMap = new Map<string, number>();
      itemsWithOrder.forEach((item, index) => {
        if (item._id) {
          orderMap.set(item._id, index);
        }
      });
      localStorage.setItem(`temp_order_${topicId}`, JSON.stringify(Array.from(orderMap.entries())));
    } catch (error) {
      console.error('Error saving temporary order:', error);
    }
    
    const event = new CustomEvent('materialReordered', { 
      detail: { topicId } 
    });
    window.dispatchEvent(event);
  };
  
  // Listen for materialReordered event
  useEffect(() => {
    const handleMaterialReorder = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.topicId === topicId) {
        setRefreshKey(prev => prev + 1);
      }
    };
    
    window.addEventListener('materialReordered', handleMaterialReorder as EventListener);
    return () => {
      window.removeEventListener('materialReordered', handleMaterialReorder as EventListener);
    };
  }, [topicId]);
  
  // Handle edit material
  const handleEditMaterial = (id: string) => {
    console.log('Edit material:', id);
  };

  // Calculate total contribution minutes
  const totalContributionMins = userData?.contributions?.reduce(
    (total, item) => total + (item.count || 0), 
    0
  ) || 0;
  
  // Handle category filter change
  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilters(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Output debug information
  useEffect(() => {
    console.log('Current topic:', currentTopic?.name);
    console.log('Original material data:', materials);
  }, [currentTopic, materials]);
  
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
  
  // Render main content
  const renderMainContent = () => {
    // 準備 topics 資料
    const topicsAsMaterials = userData?.topics?.map(topic => ({
      ...topic,
      type: 'topic',
      isCompleted: false,
      title: topic.name,
      url: null,
      dateAdded: topic.createdAt || new Date().toISOString(),
      order: topic.order || 0
    })) || [];

    if (currentMode === 'path') {
      return (
        <PathView
          topic={currentTopic || {
            name: 'All Topics',
            materials: topicsAsMaterials,
            _id: 'all-topics',
            createdAt: new Date().toISOString(),
            order: 0
          }}
          materials={currentTopic ? materials : topicsAsMaterials}
          contributions={userData?.contributions}
          unitMinutes={unitMinutes}
          setUnitMinutes={setUnitMinutes}
          onUpdateProgress={handleUpdateProgress}
          onComplete={handleToggleCompletion}
          onDelete={handleDeleteMaterial}
          onReorderItems={handleReorderMaterials}
          isAllTopics={!currentTopic}
        />
      );
    } else {
      return (
        <ListLayout 
          data={userData?.contributions || []}
          year={new Date().getFullYear()}
          userData={userData || undefined}
          onEditProfile={() => {}}
          totalContributions={totalContributionMins}
          contributions={userData?.contributions}
          materials={currentTopic ? materials : topicsAsMaterials}
          categoryFilters={categoryFilters}
          setCategoryFilters={setCategoryFilters}
          listSubMode={listSubMode}
          setListSubMode={setListSubMode}
          showAddNewMaterial={showAddNewMaterial}
          setShowAddNewMaterial={setShowAddNewMaterial}
          topicId={topicId || ''}
          refreshKey={refreshKey}
          unitMinutes={unitMinutes}
          setUnitMinutes={setUnitMinutes}
          onUpdateProgress={handleUpdateProgress}
          onComplete={handleToggleCompletion}
          onEdit={handleEditMaterial}
          onDelete={handleDeleteMaterial}
          onReorderItems={handleReorderMaterials}
          onTopicChange={handleTopicChange}
          onAddTopic={() => router.push('/database/add-topic')}
          currentTopic={currentTopic || {
            name: 'All Topics',
            materials: topicsAsMaterials,
            _id: 'all-topics',
            createdAt: new Date().toISOString(),
            order: 0
          }}
          isAllTopics={!currentTopic}
        />
      );
    }
  };

  return (
    <div className="">
      {/* Top Navigation Bar */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto py-4">
          <div className="flex justify-between items-center">
            {/* Left: Breadcrumb */}
            <div className="flex items-center">
              <button 
                className="text-gray-600 hover:text-gray-900 flex items-center"
                onClick={() => router.push('/database')}
              >
                <span className="font-medium">
                  {currentMode === 'path' ? 'Learning Path' : 'Materials List'}
                </span>
              </button>
              {currentTopic && (
                <>
                  <MdKeyboardArrowRight className="text-gray-900 w-5 h-5 mx-2" />
                  <span className="text-gray-900">{currentTopic.name}</span>
                </>
              )}
            </div>

            {/* Center: Search and Add Material */}
            <div className="flex-1 max-w-2xl mx-4">
              <div className="flex items-center justify-center">
                <AddNewMaterial onSubmit={handleAddMaterial} />
              </div>
            </div>

            {/* Right: User Account */}
            <div className="flex items-center">
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <span className="font-medium hidden md:inline">Hi, {userData?.name || 'User'}</span>
                  <IoIosArrowDown className="w-4 h-4 text-gray-600" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={() => router.push('/')}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Home
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
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-4">
        {renderMainContent()}
      </div>
    </div>
  );
} 