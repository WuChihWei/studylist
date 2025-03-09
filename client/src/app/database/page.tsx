'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { useViewMode } from '@/hooks/useViewMode';
import LearningPathFlow from '@/app/components/LearningPathFlow';
import UnifiedTableView from '@/app/components/UnifiedTableView';
import AddNewMaterial from '@/app/components/AddNewMaterial';
import { Plus, ChevronLeft, Link as LinkIcon, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Material, MaterialInput } from '@/types/User';
import ContributionGraph from '@/app/components/ContributionGraph';
import { Button } from '@/app/components/ui/button';
import Image from 'next/image';
import { FiVideo, FiBook } from 'react-icons/fi';
import { HiOutlineMicrophone } from 'react-icons/hi';
import { BiWorld } from 'react-icons/bi';
import { BsListUl, BsGrid } from 'react-icons/bs';

export default function DatabasePage() {
  const { userData, addMaterial, deleteMaterial, completeMaterial, uncompleteMaterial, updateMaterialProgress, updateProfile } = useUserData();
  const { viewMode: globalViewMode, setViewMode: setGlobalViewMode } = useViewMode();
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams?.get('topic');
  const mode = searchParams?.get('mode') as 'list' | 'path' | null;
  
  const [currentTopic, setCurrentTopic] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [showAddNewMaterial, setShowAddNewMaterial] = useState(false);
  const [unitMinutes, setUnitMinutes] = useState(20);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [activeView, setActiveView] = useState('materials'); // 'materials' or 'contributions'
  
  // 新增视图模式状态
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [reorderCounter, setReorderCounter] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // State for category filters
  const [categoryFilters, setCategoryFilters] = useState({
    web: true,
    video: true,
    podcast: true,
    book: true
  });

  // Design tags based on user screenshot
  const designTags = ['Design', 'System Design'];
  
  // Effect to fetch topic data when the topicId changes
  useEffect(() => {
    if (userData && topicId) {
      console.log('获取到的userData:', userData);
      const topic = userData.topics?.find((t) => t._id === topicId);
      console.log('当前选择的主题:', topic);
      
      if (topic) {
        setCurrentTopic(topic);
        
        // Extract materials from topic
        let topicMaterials: any[] = [];
        
        // 检查新数据结构
        if (topic.materials && topic.materials.length > 0) {
          console.log('使用新数据结构 - materials数组:', topic.materials);
          topicMaterials = [...topic.materials];
        } 
        // 检查旧数据结构
        else if (topic.categories) {
          console.log('使用旧数据结构 - categories对象:', topic.categories);
          // 从categories中提取所有materials
          topicMaterials = [
            ...(topic.categories.webpage || []).map(m => ({ ...m, type: 'webpage' as const })),
            ...(topic.categories.video || []).map(m => ({ ...m, type: 'video' as const })),
            ...(topic.categories.podcast || []).map(m => ({ ...m, type: 'podcast' as const })),
            ...(topic.categories.book || []).map(m => ({ ...m, type: 'book' as const }))
          ];
        }
        
        // 添加索引并排序
        const materialsWithIndex = topicMaterials.map((material, index) => ({
          ...material,
          index: index + 1,
          order: material.order || index // 确保有order属性
        })).sort((a, b) => (a.order || 0) - (b.order || 0));
        
        console.log('处理后的材料数据:', materialsWithIndex);
        setMaterials(materialsWithIndex);
      }
    } else {
      setCurrentTopic(null);
      setMaterials([]);
    }
  }, [userData, topicId]);

  // 初始化用户资料编辑表单
  useEffect(() => {
    if (userData) {
      setEditedName(userData.name || '');
      setEditedBio(userData.bio || '');
    }
  }, [userData]);
  
  // Determine which view to show based on the current mode
  const currentMode = mode || globalViewMode;
  
  // Handle add material
  const handleAddMaterial = (materialData: {
    title: string;
    type: string;
    url: string | null;
    favicon?: string | null;
  }) => {
    if (!topicId) return;
    
    // Convert to MaterialInput format that API expects
    const input: MaterialInput = {
      title: materialData.title,
      type: materialData.type as "webpage" | "book" | "video" | "podcast",
      url: materialData.url || '',
      rating: 5,
      favicon: materialData.favicon === null ? undefined : materialData.favicon
    };
    
    // Call the API - note: the order of parameters is different in the hook
    addMaterial(input, topicId);
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
  const handleUpdateProgress = async (materialId: string, updates: any) => {
    if (!topicId) return false;
    try {
      return await updateMaterialProgress(materialId, topicId, {
        completedUnits: updates.completedUnits || 0,
        completed: updates.completed || false,
        readingTime: updates.readingTime || 0
      });
    } catch (error) {
      console.error('Error updating material progress:', error);
      return false;
    }
  };
  
  // Handle topic navigation
  const handleTopicChange = (id: string) => {
    router.push(`/database?topic=${id}&mode=${currentMode}`);
  };
  
  // Handle reorder materials
  const handleReorderMaterials = async (reorderedItems: any[]) => {
    console.log('🔄 handleReorderMaterials 开始执行，收到项目数量:', reorderedItems.length);
    
    // 确保所有项目都有正确的order属性
    const itemsWithOrder = reorderedItems.map((item, idx) => ({
      ...item,
      order: idx // 确保order属性与当前位置一致
    }));
    
    // 立即更新本地UI状态
    setMaterials(itemsWithOrder);
    setReorderCounter(prev => prev + 1);
    
    // 保存当前重新排序的项目到localStorage
    try {
      const orderMap = new Map<string, number>();
      itemsWithOrder.forEach((item, index) => {
        if (item._id) {
          orderMap.set(item._id, index);
        }
      });
      localStorage.setItem(`temp_order_${topicId}`, JSON.stringify(Array.from(orderMap.entries())));
      console.log('🔄 保存临时顺序到localStorage:', topicId);
    } catch (error) {
      console.error('🔄 保存临时顺序到localStorage失败:', error);
    }
    
    // 触发materialReordered事件
    const event = new CustomEvent('materialReordered', { 
      detail: { topicId } 
    });
    window.dispatchEvent(event);
    
    // 更新后端数据
    try {
      // 这里实现实际的后端更新逻辑
      console.log('🔄 更新后端数据');
      
      // 模拟后端处理延迟
      setTimeout(() => {
        // 再次强制刷新UI
        setReorderCounter(prev => prev + 1);
        console.log('🔄 刷新UI完成');
      }, 100);
      
      return itemsWithOrder;
    } catch (error) {
      console.error('🔄 更新后端数据失败:', error);
      return reorderedItems; // 失败时返回原始顺序
    }
  };
  
  // 监听materialReordered事件
  useEffect(() => {
    const handleMaterialReorder = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.topicId === topicId) {
        console.log('🔄 收到materialReordered事件，强制刷新UI');
        setRefreshKey(prev => prev + 1);
      }
    };
    
    window.addEventListener('materialReordered', handleMaterialReorder as EventListener);
    
    return () => {
      window.removeEventListener('materialReordered', handleMaterialReorder as EventListener);
    };
  }, [topicId]);
  
  // 强制刷新UI
  useEffect(() => {
    if (reorderCounter > 0) {
      console.log('🔄 强制刷新UI，reorderCounter:', reorderCounter);
    }
  }, [reorderCounter]);
  
  // Navigate back to topics list
  const handleBackToTopics = () => {
    router.push('/database');
  };

  // 处理编辑个人资料
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  // 处理保存个人资料
  const handleSaveProfile = async () => {
    try {
      await updateProfile({ name: editedName, bio: editedBio });
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // 计算总贡献时间
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

  // Filter materials based on category filters
  const filteredMaterials = materials.filter(material => {
    if (material.type === 'webpage' && categoryFilters.web) return true;
    if (material.type === 'video' && categoryFilters.video) return true;
    if (material.type === 'podcast' && categoryFilters.podcast) return true;
    if (material.type === 'book' && categoryFilters.book) return true;
    return false;
  });
  
  // 输出调试信息
  useEffect(() => {
    console.log('当前主题:', currentTopic?.name);
    console.log('原始材料数据:', materials);
    console.log('过滤后的材料数据:', filteredMaterials);
  }, [currentTopic, materials, filteredMaterials]);
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* 顶部导航栏 */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
        <div className="flex items-center">
          <div className="flex items-center">
            {userData?.photoURL ? (
              <img
                className="h-8 w-8 rounded-full mr-2"
                src={userData.photoURL}
                alt={userData.name || 'User'}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <span className="text-blue-800 font-medium text-sm">
                  {userData?.name?.substring(0, 1) || 'U'}
                </span>
              </div>
            )}
            <span className="font-medium">{userData?.name || 'User'}</span>
          </div>
        </div>

        {/* 所在位置面包屑 */}
        <div className="flex items-center">
          <div className="flex items-center">
            <button 
              className="p-1 rounded-md hover:bg-gray-100 flex items-center"
              onClick={handleBackToTopics}
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
              <span className="ml-1 text-gray-600 text-sm">返回</span>
            </button>
            
            {currentTopic && (
              <>
                <span className="text-gray-400 mx-2">/</span>
                <span className="text-sm font-medium">{currentTopic.name}</span>
                <span className="text-gray-400 mx-2">{'>'}</span>
                <span className="text-sm text-gray-600">Materials</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          {currentTopic && (
            <div className="mr-4">
              <AddNewMaterial onSubmit={handleAddMaterial} />
            </div>
          )}
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          <button className="ml-2 p-2 text-gray-500 hover:text-gray-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </div>
    
      {/* 用户资料和贡献图表区域 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 用户资料区域 */}
          <div className="lg:col-span-1">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">
                {userData?.photoURL ? (
                  <img
                    className="h-20 w-20 rounded-full"
                    src={userData.photoURL}
                    alt={userData.name || 'User'}
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-800 font-medium text-2xl">
                      {userData?.name?.substring(0, 1) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                {isEditingProfile ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      rows={3}
                    ></textarea>
                    <div className="flex space-x-2">
                      <Button onClick={handleSaveProfile}>Save</Button>
                      <Button variant="outline" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center">
                      <h1 className="text-2xl font-bold">{userData?.name || 'User'}</h1>
                      <button 
                        onClick={handleEditProfile}
                        className="ml-2 p-1 rounded-full hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                    <p className="text-gray-600 mt-1">{userData?.bio || 'No bio yet'}</p>
                    <div className="flex items-center mt-2 text-gray-600">
                      <span className="text-sm">
                        Total contribution: <span className="font-semibold">{totalContributionMins}</span> mins
                      </span>
                    </div>
                    
                    {/* 用户设计标签 */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {designTags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 text-sm bg-gray-100 rounded-full text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* 贡献图表区域 */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Contribution Graph</h2>
            </div>
            <ContributionGraph 
              data={userData?.contributions?.map(c => ({
                date: c.date,
                count: c.count || 0,
                studyCount: 0 // 默认为0，因为userData中的contributions没有studyCount属性
              })) || []} 
              activeView={activeView} 
            />
          </div>
        </div>
      </div>

      {currentTopic ? (
        <>
          
          
          {/* Topic navigation tabs */}
          <div className="flex flex-col items-stretch mb-8">
            <div className="mb-2 border-b border-gray-200">
              <div className="flex items-center space-x-1">
                {userData?.topics?.map((topic) => (
                  <button
                    key={topic._id}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      topicId === topic._id
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleTopicChange(topic._id || '')}
                  >
                    {topic.name}
                  </button>
                ))}
                
                <button
                  className="p-2 text-gray-500 hover:text-blue-500"
                  onClick={() => router.push('/database/add-topic')}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold flex items-center">
                {currentTopic?.name || "Topic"}
                <button className="ml-2 text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
              </h1>
            </div>
          </div>
          
          {/* Category filters */}
          {currentMode === 'list' && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-1">
                <button
                  className={`px-4 py-2 text-sm rounded-md flex items-center ${
                    categoryFilters.web && categoryFilters.video && categoryFilters.podcast && categoryFilters.book 
                      ? 'bg-gray-900 text-white font-medium' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    setCategoryFilters({
                      web: true,
                      video: true,
                      podcast: true,
                      book: true
                    });
                  }}
                >
                  <span className="flex items-center justify-center w-5 h-5 mr-2">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </span>
                  All ({materials.length})
                </button>
                <button
                  className={`px-4 py-2 text-sm rounded-md flex items-center ${
                    categoryFilters.web && !categoryFilters.video && !categoryFilters.podcast && !categoryFilters.book
                      ? 'bg-gray-900 text-white font-medium' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    setCategoryFilters({
                      web: true,
                      video: false,
                      podcast: false,
                      book: false
                    });
                  }}
                >
                  <span className="flex items-center justify-center w-5 h-5 mr-2">
                    <BiWorld className="w-4 h-4" />
                  </span>
                  Web ({materials.filter(m => m.type === 'webpage').length})
                </button>
                <button
                  className={`px-4 py-2 text-sm rounded-md flex items-center ${
                    categoryFilters.video && !categoryFilters.web && !categoryFilters.podcast && !categoryFilters.book
                      ? 'bg-gray-900 text-white font-medium' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    setCategoryFilters({
                      web: false,
                      video: true,
                      podcast: false,
                      book: false
                    });
                  }}
                >
                  <span className="flex items-center justify-center w-5 h-5 mr-2">
                    <FiVideo className="w-4 h-4" />
                  </span>
                  Video ({materials.filter(m => m.type === 'video').length})
                </button>
                <button
                  className={`px-4 py-2 text-sm rounded-md flex items-center ${
                    categoryFilters.podcast && !categoryFilters.web && !categoryFilters.video && !categoryFilters.book
                      ? 'bg-gray-900 text-white font-medium' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    setCategoryFilters({
                      web: false,
                      video: false,
                      podcast: true,
                      book: false
                    });
                  }}
                >
                  <span className="flex items-center justify-center w-5 h-5 mr-2">
                    <HiOutlineMicrophone className="w-4 h-4" />
                  </span>
                  Podcast ({materials.filter(m => m.type === 'podcast').length})
                </button>
                <button
                  className={`px-4 py-2 text-sm rounded-md flex items-center ${
                    categoryFilters.book && !categoryFilters.web && !categoryFilters.video && !categoryFilters.podcast
                      ? 'bg-gray-900 text-white font-medium' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    setCategoryFilters({
                      web: false,
                      video: false,
                      podcast: false,
                      book: true
                    });
                  }}
                >
                  <span className="flex items-center justify-center w-5 h-5 mr-2">
                    <FiBook className="w-4 h-4" />
                  </span>
                  Book ({materials.filter(m => m.type === 'book').length})
                </button>
              </div>
              
              {/* 视图切换按钮 */}
              <div className="flex bg-gray-100 p-1 rounded-md">
                <button
                  className={`p-2 rounded ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-700'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  <BsListUl className="h-4 w-4" />
                </button>
                <button
                  className={`p-2 rounded ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-700'
                  }`}
                  onClick={() => setViewMode('grid')}
                >
                  <BsGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          {currentMode === 'list' ? (
            // 使用UnifiedTableView替换自定义表格
            <>
              {filteredMaterials.length > 0 ? (
                <UnifiedTableView
                  key={`${topicId}-${refreshKey}`}
                  materials={filteredMaterials.map((material, index) => ({
                    ...material,
                    index: index + 1
                  }))}
                  viewType="materials"
                  viewMode={viewMode}
                  onEdit={() => {}} // 实现编辑功能
                  onDelete={handleDeleteMaterial}
                  onComplete={handleToggleCompletion}
                  onUpdateProgress={handleUpdateProgress}
                  onReorderItems={handleReorderMaterials}
                  unitMinutes={unitMinutes}
                  onUnitMinutesChange={setUnitMinutes}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow text-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-4">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">没有材料</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    在这个主题下没有找到任何学习材料。点击上方的"Add New Material..."按钮添加您的第一个材料。
                  </p>
                  <Button 
                    onClick={() => setShowAddNewMaterial(true)}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加学习材料
                  </Button>
                </div>
              )}
            </>
          ) : (
            // Path view
            <div className="bg-white rounded-lg shadow-sm p-6">
              <LearningPathFlow 
                materials={materials}
                onSavePath={() => {}} // Implement if needed
                savedNodes={undefined}
                savedEdges={undefined}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Select a Topic</h2>
          <p className="text-gray-500 mb-6">Choose a topic from the sidebar to view its materials</p>
          
          {userData?.topics && userData.topics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
              {userData.topics.slice(0, 6).map((topic) => (
                <button
                  key={topic._id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                  onClick={() => handleTopicChange(topic._id || '')}
                >
                  <h3 className="font-medium">{topic.name}</h3>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500 mb-4">You don't have any topics yet.</p>
              <Button 
                onClick={() => router.push('/database/add-topic')}
                className="inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add your first topic
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 