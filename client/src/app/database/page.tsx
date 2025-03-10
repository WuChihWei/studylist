'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { useViewMode } from '@/hooks/useViewMode';
import LearningPathFlow from '@/app/components/LearningPathFlow';
import UnifiedTableView from '@/app/components/UnifiedTableView';
import AddNewMaterial from '@/app/components/AddNewMaterial';
import { Plus, ChevronLeft, Link as LinkIcon, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Material, MaterialPayload, Topic } from '@/types/User';
import ContributionGraph from '@/app/components/ContributionGraph';
import { Button } from '@/app/components/ui/button';
import Image from 'next/image';
import { FiVideo, FiBook } from 'react-icons/fi';
import { HiOutlineMicrophone } from 'react-icons/hi';
import { BiWorld } from 'react-icons/bi';
import { BsListUl, BsGrid } from 'react-icons/bs';
import PathView from '../components/PathView';
import ListView from '../components/ListView';
import { ViewMode, ListSubMode } from '@/types/ViewMode';
import PathLayout from '../components/PathLayout';

export default function DatabasePage() {
  const { userData, addMaterial, deleteMaterial, completeMaterial, uncompleteMaterial, updateMaterialProgress, updateProfile } = useUserData();
  const { viewMode: globalViewMode, setViewMode: setGlobalViewMode } = useViewMode();
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams?.get('topic');
  const modeParam = searchParams?.get('mode');
  const mode = modeParam === 'list' || modeParam === 'path' ? modeParam as ViewMode : undefined;
  
  const [currentTopic, setCurrentTopic] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [showAddNewMaterial, setShowAddNewMaterial] = useState(false);
  const [unitMinutes, setUnitMinutes] = useState(20);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [activeView, setActiveView] = useState('materials'); // 'materials' or 'contributions'
  
  // 使用 mode 或 globalViewMode 作为当前模式
  const currentMode: ViewMode = mode || globalViewMode;
  
  // 列表视图的子模式：列表或网格
  const [listSubMode, setListSubMode] = useState<ListSubMode>('list');
  
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
  
  // Handle add material
  const handleAddMaterial = (materialData: {
    title: string;
    type: string;
    url: string | null;
    favicon?: string | null;
  }) => {
    if (!topicId) return;
    
    // 获取当前主题的材料计数
    const topicMaterials = userData?.materials 
      ? userData.materials.filter(m => m.topicId === currentTopic?._id)
      : [];
    
    // Convert form data to MaterialPayload
    const payload: MaterialPayload = {
      title: materialData.title,
      type: materialData.type as 'webpage' | 'video' | 'book' | 'podcast',
      url: materialData.url,
      favicon: materialData.favicon || undefined,
      rating: 0,
      dateAdded: new Date().toISOString(),
      order: materials.length + 1,
    };
    
    // Call the API
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
      // 转换为旧的参数格式，保持兼容性
      const updates = {
        completedUnits: completed,
        completed: completed >= total,
        readingTime: total
      };
      
      // 调用API更新进度
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
    } catch (error) {
      console.error('🔄 更新后端数据失败:', error);
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
  
  // 输出调试信息
  useEffect(() => {
    console.log('当前主题:', currentTopic?.name);
    console.log('原始材料数据:', materials);
  }, [currentTopic, materials]);
  
  // Handle edit material
  const handleEditMaterial = (id: string) => {
    // TODO: Implement edit functionality
    console.log('编辑材料:', id);
  };

  // 渲染主要内容
  const renderMainContent = () => {
    if (!currentTopic) {
      return <div className="text-center p-8 text-gray-500">请选择一个主题</div>;
    }

    // 根据 currentMode 渲染不同的视图组件
    if (currentMode === 'path') {
      return (
        <PathView
          topic={currentTopic}
          materials={materials}
          contributions={userData?.contributions}
          unitMinutes={unitMinutes}
          setUnitMinutes={setUnitMinutes}
          onUpdateProgress={handleUpdateProgress}
          onComplete={handleToggleCompletion}
          onDelete={handleDeleteMaterial}
          onReorderItems={handleReorderMaterials}
        />
      );
    } else {
      return (
        <ListView
          materials={materials}
          categoryFilters={categoryFilters}
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
        />
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 顶部导航栏 */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
        

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
         
        </div>

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
                    currentMode === ('list' as ViewMode) ? 'bg-white shadow-sm' : 'text-gray-700'
                  }`}
                  onClick={() => {
                    router.push(`/database?topic=${topicId}&mode=list`);
                  }}
                >
                  <BsListUl className="h-4 w-4" />
                </button>
                <button
                  className={`p-2 rounded ${
                    currentMode === ('path' as ViewMode) ? 'bg-white shadow-sm' : 'text-gray-700'
                  }`}
                  onClick={() => {
                    router.push(`/database?topic=${topicId}&mode=path`);
                  }}
                >
                  <BsGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* 使用renderMainContent来显示主要内容 */}
          {renderMainContent()}
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