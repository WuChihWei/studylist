"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUserData } from '@/hooks/useUserData';
import styles from './profile.module.css';
import Image from 'next/image';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useRouter } from 'next/navigation';
import ContributionGraph from '../components/ContributionGraph';
import { MdEdit } from "react-icons/md";
import MaterialsView from './MaterialsView';
import StudyListView from './StudyListView';
import { auth } from '../firebase/firebaseConfig';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Sidebar } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import { EditProfileDialog } from "../components/EditProfileDialog";
import { Input } from "@/app/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import Link from "next/link";
import { MdWeb } from "react-icons/md";
import { FiVideo, FiBook } from "react-icons/fi";
import { HiOutlineMicrophone } from "react-icons/hi";
import AddNewMaterial from '../components/AddNewMaterial';
import { BsListUl, BsGrid } from "react-icons/bs";
import { ChevronDown, User, Home, LogOut } from "lucide-react";
import { FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import { Card, CardContent } from '@/app/components/ui/card';
import { cn } from "@/lib/utils";
import { Material, Categories } from '@/types/User';
import { IoSave } from "react-icons/io5";
import { useFirebase } from '../firebase/FirebaseProvider';

// 在組件頂部添加 debounce 工具函數
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function ProfilePage() {
  const { userData, loading, updateProfile, addTopic, updateTopicName, addMaterial, getContributionData, completeMaterial, uncompleteMaterial, fetchUserData, deleteMaterial, deleteTopic, updateMaterialProgress } = useUserData();
  const { auth } = useFirebase();
  
  // 定義 API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  const [activeTab, setActiveTab] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editedTopicName, setEditedTopicName] = useState('');
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: '',
    url: '',
    rating: 5
  });
  const router = useRouter();
  const [activeView, setActiveView] = useState<'topics' | 'materials' | 'studylist'>('topics');
  const [activeCategory, setActiveCategory] = useState<'all' | 'webpage' | 'video' | 'podcast' | 'book'>('all');
  const [unitMinutes, setUnitMinutes] = useState(20);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    topicId: string | null;
  }>({
    isOpen: false,
    topicId: null
  });
  const [isTopicListView, setIsTopicListView] = useState(true);
  const [pendingReorder, setPendingReorder] = useState<{
    topicId: string;
    materials: Material[];
  } | null>(null);

  // 使用 useState 技巧來強制重新渲染組件
  const [, setForceUpdate] = useState(0);
  const forceUpdate = () => setForceUpdate(prev => prev + 1);
  
  // 使用 ref 來追踪刷新狀態
  const refreshScheduledRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初始化設置
    handleResize();

    // 添加事件監聽器
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const checkSidebarState = () => {
      const cookies = document.cookie.split(';');
      const sidebarCookie = cookies.find(cookie => cookie.trim().startsWith('sidebar_state='));
      if (sidebarCookie) {
        const sidebarState = sidebarCookie.split('=')[1];
        setSidebarCollapsed(sidebarState === 'true');
      }
    };

    checkSidebarState();
    
    const handleStorageChange = () => {
      checkSidebarState();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const observer = new MutationObserver(() => {
      checkSidebarState();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-sidebar-collapsed']
    });
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (userData && userData.topics && userData.topics.length > 0 && !activeTab) {
      const firstTopicId = userData.topics[0]._id;
      if (firstTopicId) {
        setActiveTab(firstTopicId);
      }
    }
  }, [userData, activeTab]);

  useEffect(() => {
    if (userData) {
      setEditedName(userData.name || '');
      setEditedBio(userData.bio || 'Introduce yourself');
    }
  }, [userData]);

  const handleEditProfile = () => {
    setEditedName(userData?.name || '');
    setEditedBio(userData?.bio || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async (name: string, bio: string) => {
    try {
      await updateProfile({ name, bio });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleEditTopic = (topicId: string, currentName: string) => {
    setEditingTopicId(topicId);
    setEditedTopicName(currentName);
  };

  const handleSaveTopicName = async (topicId: string) => {
    if (await updateTopicName(topicId, editedTopicName)) {
      setEditingTopicId(null);
      return true;
    }
    return false;
  };

  const handleAddTopic = async () => {
    try {
      const newTopicName = `Topic ${(userData?.topics?.length || 0) + 1}`;
      const success = await addTopic(newTopicName);
      
      if (!success) {
        console.error('Failed to add topic');
      }
      return success;
    } catch (error) {
      console.error('Error adding topic:', error);
      return false;
    }
  };

  const handleCancelEditTopic = () => {
    setEditingTopicId(null);
    setEditedTopicName('');
  };

  const handleDeleteTopic = (topicId: string) => {
    setDeleteConfirmation({
      isOpen: true,
      topicId
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.topicId || !userData) return;

    try {
      const success = await deleteTopic(deleteConfirmation.topicId);
      
      if (success) {
        if (activeTab === deleteConfirmation.topicId && userData.topics?.length > 1) {
          const nextTopic = userData.topics.find(t => t._id !== deleteConfirmation.topicId);
          if (nextTopic?._id) {
            setActiveTab(nextTopic._id);
          }
        }
      } else {
        alert('Failed to delete topic. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic. Please try again.');
    } finally {
      setDeleteConfirmation({ isOpen: false, topicId: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, topicId: null });
  };

  const handleAddMaterial = async (material: any) => {
    try {
      const success = await addMaterial({
        title: material.title.trim(),
        type: material.type,
        url: material.url?.trim(),
        rating: material.rating || 5,
        dateAdded: new Date()
      }, activeTab);
      
      return success === true;
    } catch (error) {
      console.error('Error adding material:', error);
      return false;
    }
  };

  const handleTopicSelect = (topicId: string | undefined) => {
    if (topicId) {
      setActiveTab(topicId);
      setIsTopicListView(false);
    }
  };

  const handleBackToTopics = () => {
    setIsTopicListView(true);
  };

  const handleViewChange = (view: 'topics' | 'materials' | 'studylist') => {
    setActiveView(view);
    if (view === 'topics') {
      setIsTopicListView(true);
    } else {
      setIsTopicListView(false);
    }
  };

  const handleSidebarNavigation = (view: 'topics' | 'materials' | 'studylist') => {
    setActiveView(view);
    if (view === 'topics') {
      setIsTopicListView(true);
    } else {
      setIsTopicListView(false);
    }
  };

  // 修改重新排序處理函數，實現立即更新UI而不刷新頁面
  const handleReorderMaterials = async (materials: Material[]) => {
    console.log('🔄 handleReorderMaterials 開始執行', new Date().toISOString());
    console.log('🔄 收到的材料數量:', materials.length);
    console.log('🔄 材料順序:', materials.map(m => `${m._id}:${m.order}`));
    
    try {
      // 保存當前活動的主題ID到localStorage，以便其他組件可以使用
      localStorage.setItem('activeTopicId', activeTab);
      console.log('🔄 保存 activeTopicId 到 localStorage:', activeTab);
      
      // 確保材料有正確的order屬性
      const materialsWithOrder = materials.map((material, index) => ({
        ...material,
        order: index
      }));
      console.log('🔄 更新 order 屬性後的材料:', materialsWithOrder.map(m => `${m._id}:${m.order}`));
      
      // 保存重新排序的數據
      const reorderData = {
        topicId: activeTab,
        materials: materialsWithOrder
      };
      console.log('🔄 創建 reorderData:', { topicId: reorderData.topicId, materialsCount: reorderData.materials.length });
      
      // 保存當前排序到localStorage，以便在頁面刷新或網絡錯誤時恢復
      try {
        const orderMap = new Map<string, number>();
        materialsWithOrder.forEach((material, index) => {
          if (material._id) {
            orderMap.set(material._id, index);
          }
        });
        localStorage.setItem(`temp_order_${activeTab}`, JSON.stringify(Array.from(orderMap.entries())));
        console.log('🔄 保存臨時順序到 localStorage:', activeTab, Array.from(orderMap.entries()));
      } catch (error) {
        console.error('🔄 保存臨時順序到 localStorage 失敗:', error);
      }
      
      // 立即更新本地狀態
      // 這是關鍵修改：直接更新 userData 中的材料順序
      if (userData && userData.topics) {
        // 找到當前活動的主題
        const activeTopic = userData.topics.find(t => t._id === activeTab);
        
        if (activeTopic && activeTopic.categories) {
          // 創建一個新的 categories 對象，保持原始結構
          const updatedCategories: Categories = {
            webpage: [...activeTopic.categories.webpage],
            video: [...activeTopic.categories.video],
            podcast: [...activeTopic.categories.podcast],
            book: [...activeTopic.categories.book]
          };
          
          // 更新每個材料的 order 屬性
          materialsWithOrder.forEach(material => {
            if (material._id && material.type) {
              const categoryArray = updatedCategories[material.type];
              const materialIndex = categoryArray.findIndex(m => m._id === material._id);
              
              if (materialIndex !== -1) {
                categoryArray[materialIndex] = {
                  ...categoryArray[materialIndex],
                  order: material.order
                };
              }
            }
          });
          
          // 手動更新 UI 中顯示的數據
          // 注意：這不會修改原始 userData，但會影響渲染
          activeTopic.categories = updatedCategories;
        }
      }
      
      // 立即強制更新UI
      console.log('🔄 強制更新 UI');
      forceUpdate();
      
      // 延遲 50ms 後再次強制更新
      setTimeout(() => {
        console.log('🔄 第一次延遲強制刷新');
        forceUpdate();
        
        // 觸發 materialReordered 事件
        const event = new CustomEvent('materialReordered', { 
          detail: { topicId: activeTab } 
        });
        console.log('🔄 materialReordered 事件已觸發');
        window.dispatchEvent(event);
      }, 50);
      
      // 延遲 150ms 後第二次強制更新
      setTimeout(() => {
        console.log('🔄 第二次延遲強制刷新');
        forceUpdate();
        
        // 再次觸發 materialReordered 事件
        const event = new CustomEvent('materialReordered', { 
          detail: { topicId: activeTab } 
        });
        console.log('🔄 materialReordered 事件再次觸發');
        window.dispatchEvent(event);
      }, 150);
      
      // 在後台提交到服務器
      console.log('🔄 開始提交到伺服器', new Date().toISOString());
      
      // 使用靜默提交方法，不阻塞UI
      console.log('🔄 調用 silentlySubmitReorder');
      silentlySubmitReorder(auth.currentUser, reorderData);
      
      // 延遲 250ms 後第三次強制更新
      setTimeout(() => {
        console.log('🔄 延遲強制刷新');
        forceUpdate();
        
        // 再次觸發 materialReordered 事件
        const event = new CustomEvent('materialReordered', { 
          detail: { topicId: activeTab } 
        });
        console.log('🔄 materialReordered 事件已觸發');
        window.dispatchEvent(event);
      }, 250);
      
    } catch (error) {
      console.error('🔄 處理重新排序時出錯:', error);
      alert('重新排序失敗，請稍後再試');
    }
  };

  // 新增靜默提交函數
  const silentlySubmitReorder = async (user: any, reorderData: any) => {
    console.log('📤 silentlySubmitReorder 開始執行', new Date().toISOString());
    console.log('📤 reorderData:', { topicId: reorderData.topicId, materialsCount: reorderData.materials.length });
    
    try {
      if (!user) {
        console.log('📤 沒有找到用戶，返回');
        return;
      }

      const idToken = await user.getIdToken();
      console.log('📤 獲取 idToken 成功');
      
      // 從 localStorage 中獲取最新的排序數據
      const localOrderData = localStorage.getItem(`temp_order_${reorderData.topicId}`);
      if (localOrderData) {
        console.log('📤 從 localStorage 找到排序數據');
        try {
          // 將 Map 格式的數據轉換為材料數組
          const orderMap = new Map(JSON.parse(localOrderData));
          console.log('📤 解析 localStorage 數據成功，項目數量:', orderMap.size);
          
          // 使用排序映射重新排序材料
          console.log('📤 排序前的材料:', reorderData.materials.map(m => `${m._id}:${m.order}`));
          const sortedMaterials = [...reorderData.materials].sort((a, b) => {
            const orderA = a._id ? (orderMap.get(a._id) ?? 0) : 0;
            const orderB = b._id ? (orderMap.get(b._id) ?? 0) : 0;
            return Number(orderA) - Number(orderB);
          });
          console.log('📤 排序後的材料:', sortedMaterials.map(m => `${m._id}:${m.order}`));
          
          // 更新 order 屬性
          const materialsWithUpdatedOrder = sortedMaterials.map((material, index) => ({
            ...material,
            order: index
          }));
          console.log('📤 更新 order 屬性後的材料:', materialsWithUpdatedOrder.map(m => `${m._id}:${m.order}`));
          
          // 使用最新的本地順序
          reorderData.materials = materialsWithUpdatedOrder;
        } catch (error) {
          console.error('📤 解析 localStorage 數據失敗:', error);
        }
      } else {
        console.log('📤 localStorage 中沒有找到排序數據');
      }
      
      console.log('📤 準備發送 API 請求');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      
      // 使用原來的 URL 格式
      const url = `${API_URL}/api/users/${user.uid}/topics/${reorderData.topicId}/materials/reorder`;
      console.log('📤 請求 URL:', url);
      
      const response = await fetch(url, {
        method: 'PUT', // 使用 PUT 方法
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          materials: reorderData.materials
        })
      });

      console.log('📤 API 回應狀態:', response.status);
      const result = await response.json();
      console.log('📤 API 回應結果:', result);
      return result;
    } catch (error) {
      console.error('📤 silentlySubmitReorder 失敗:', error);
      throw error;
    }
  };
  
  // 從 localStorage 獲取臨時排序順序以用於顯示
  const getDisplayMaterials = (topicId: string, materials: Material[]) => {
    console.log('🔍 getDisplayMaterials 被調用，topicId:', topicId, '材料數量:', materials.length);
    
    if (!topicId || !materials || materials.length === 0) {
      console.log('🔍 沒有有效的 topicId 或材料，返回原始材料');
      return materials;
    }
    
    try {
      const tempOrderString = localStorage.getItem(`temp_order_${topicId}`);
      if (tempOrderString) {
        console.log('🔍 找到臨時排序數據');
        const tempOrderMaterials = JSON.parse(tempOrderString);
        console.log('🔍 臨時排序數據數量:', tempOrderMaterials.length);
        
        // 創建 ID 到 order 的映射
        const orderMap = new Map();
        tempOrderMaterials.forEach((material: any, index: number) => {
          orderMap.set(material._id, { order: index, data: material });
        });
        
        console.log('🔍 使用臨時排序映射，大小:', orderMap.size);
        
        // 創建材料副本，以避免修改原始數據
        const materialsCopy = materials.map(material => {
          // 如果在臨時排序中找到此材料，使用臨時的順序和數據
          if (orderMap.has(material._id)) {
            const tempData = orderMap.get(material._id).data;
            return {
              ...material,
              ...tempData,
              order: orderMap.get(material._id).order
            };
          }
          return material;
        });
        
        // 按順序屬性排序
        const sortedMaterials = materialsCopy.sort((a, b) => (a.order || 0) - (b.order || 0));
        console.log('🔍 返回排序後的材料，數量:', sortedMaterials.length);
        
        // 記錄排序後的前幾個項目，以便確認排序是否正確
        console.log('🔍 排序後的前3個項目:', sortedMaterials.slice(0, 3).map(m => ({ id: m._id, title: m.title, order: m.order })));
        
        return sortedMaterials;
      }
    } catch (e) {
      console.error('🔍 解析臨時排序時出錯', e);
    }
    
    // 如果沒有臨時排序或出錯，按原始排序順序返回
    console.log('🔍 沒有臨時排序，返回原始排序');
    return [...materials].sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // 使用 useCallback 優化頁面離開保存函數
  const savePendingReorderCallback = useCallback(async () => {
    if (!pendingReorder) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/users/${user.uid}/topics/${pendingReorder.topicId}/materials/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ materials: pendingReorder.materials })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 清除待處理的排序
      setPendingReorder(null);
      
      // 更新用戶數據 - 但只在離開頁面或視圖切換時執行
      await fetchUserData(user);
      console.log('排序已成功保存到後端（通過離開頁面或視圖切換觸發）');
    } catch (error) {
      console.error('保存排序時出錯:', error);
    }
  }, [pendingReorder, fetchUserData, auth, API_URL]);

  // 使用 savePendingReorderCallback 替換舊的函數引用
  const savePendingReorder = savePendingReorderCallback;

  // 在用戶離開頁面前檢查是否有未保存的排序
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingReorder) {
        // 嘗試保存未保存的排序
        savePendingReorder();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pendingReorder, savePendingReorder]);

  // 監聽頁面切換/視圖變更以保存排序，添加防抖以避免過多調用
  useEffect(() => {
    const debouncedSave = debounce(() => {
      if (pendingReorder && (pendingReorder.topicId !== activeTab || activeView !== 'materials' && activeView !== 'studylist')) {
        savePendingReorder();
      }
    }, 300);
    
    debouncedSave();
    
    return () => {
      // 清理函數，確保在組件卸載時不會調用過時的函數
    };
  }, [activeTab, activeView, pendingReorder, savePendingReorder]);

  // 添加事件監聽器，監聽重新排序完成事件
  useEffect(() => {
    const handleMaterialReordered = (event: CustomEvent) => {
      console.log('🔄 收到材料重新排序完成事件:', event.detail);
      // 如果是當前活動的主題，則刷新UI
      if (event.detail.topicId === activeTab) {
        console.log('🔄 是當前活動的主題，準備刷新UI');
        console.log('🔄 forceUpdate 前');
        forceUpdate();
        console.log('🔄 forceUpdate 後');
        
        // 強制重新渲染 (使用已有的 forceUpdate 函數)
        console.log('🔄 再次調用 forceUpdate');
        forceUpdate();
      } else {
        console.log('🔄 不是當前活動的主題，不刷新UI');
      }
    };

    // 添加事件監聽器
    console.log('🔄 添加 materialReordered 事件監聽器');
    window.addEventListener('materialReordered', handleMaterialReordered as EventListener);

    // 清理函數
    return () => {
      console.log('🔄 移除 materialReordered 事件監聽器');
      window.removeEventListener('materialReordered', handleMaterialReordered as EventListener);
    };
  }, [activeTab, forceUpdate]);

  if (loading) return <div>Loading...</div>;
  if (!userData) return <div>Please log in</div>;
  
  const currentTopic = userData?.topics?.find(t => t._id === activeTab);

  return (
    <div className="flex w-full h-full" style={{ "--profile-sidebar-width": sidebarCollapsed ? "var(--sidebar-width-icon)" : "var(--sidebar-width)" } as React.CSSProperties}>
      {!isMobile ? (
        <Sidebar
          activeView={activeView}
          onViewChange={(view) => {
            handleSidebarNavigation(view);
          }}
          className="border-r h-full flex-shrink-0"
          width={sidebarCollapsed ? "var(--sidebar-width-icon)" : "var(--sidebar-width)"}
        />
      ) : (
        <div className="fixed top-0 left-0 w-full z-10 border-b flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                // 在移动端打开侧边栏的逻辑
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
            <span className="ml-2 font-semibold">Mycel</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSidebarNavigation('topics')}>
                Topics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSidebarNavigation('materials')}>
                Materials
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSidebarNavigation('studylist')}>
                Study List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className={styles.profileContainer}>
        <div className="flex flex-col w-full min-h-screen px-4 md:px-12 py-4">
          <div className="flex-1">
            <div className="flex justify-between items-center py-6 md:py-10">

              <div className="flex items-center">
                      <span className="font-medium">{currentTopic?.name || 'Topic'}</span>
                      <span className="mx-2">&gt;</span>
                      <span className="text-gray-600">{activeView === 'materials' ? 'Materials' : 'Study List'}</span>
              </div>

              <div className="flex items-center gap-2 w-1/2">
                <AddNewMaterial onSubmit={handleAddMaterial} />
              </div>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Image 
                        src={userData?.photoURL || '/default-avatar.png'}
                        alt={userData?.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <span>{userData?.name || 'User'}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Link href="/profile/edit" className="w-full">
                        <User className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/" className="w-full">
                        <Home className="mr-2 h-4 w-4" />
                        Home
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => auth.signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="mt-0">
              <div className="flex flex-col md:flex-row w-full pb-6 rounded-lg shadow-sm">
                <div className="w-full md:w-1/2 flex flex-col">
                  <div className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start w-full">
                    <div className="w-20 flex flex-col mb-4 md:mb-0 md:mr-4">
                      <div className="relative w-full rounded-full overflow-hidden flex justify-center items-center">
                        <Image 
                          src={userData?.photoURL || '/default-avatar.png'}
                          alt={userData?.name || 'User'}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center text-center md:text-left">
                      <h4 className="font-bold">{userData?.name}</h4>
                      <p className="text-gray-800 max-w-xl text-base font-medium leading-normal">{userData?.bio || 'Introduce yourself'}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleEditProfile}
                        className="mt-2 self-start"
                      >
                        <MdEdit className="mr-2" /> Edit Profile
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-1/2 rounded-lg ">
                  <ContributionGraph 
                    data={getContributionData()}
                    activeView={activeView}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              {isTopicListView ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="border-none">My Topics</h2>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddTopic} 
                      className="flex items-center gap-2"
                    >
                      <FaPlus className="h-3 w-3" /> Add Topic
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userData.topics && userData.topics.map((topic) => (
                      <Card 
                        key={topic._id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleTopicSelect(topic._id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            {editingTopicId === topic._id ? (
                              <div className="flex items-center gap-2 w-full">
                                <Input
                                  value={editedTopicName}
                                  onChange={(e) => setEditedTopicName(e.target.value)}
                                  className="flex-1"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveTopicName(topic._id || '');
                                    }}
                                  >
                                    <FaCheck className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelEditTopic();
                                    }}
                                  >
                                    <FaTimes className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <h3 className="font-medium text-lg">{topic.name}</h3>
                                  <div className="text-sm text-gray-500 mt-1">
                                    <div>
                                      {Object.values(topic.categories || {}).flat().length-1} materials
                                    </div>
                                    {/* {topic.createdAt && (
                                      <div>
                                        Created: {new Date(topic.createdAt).toLocaleDateString()}
                                      </div>
                                    )} */}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTopic(topic._id || '', topic.name);
                                    }}
                                  >
                                    <MdEdit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTopic(topic._id || '');
                                    }}
                                  >
                                    <RiDeleteBin6Line className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {topic.contributors && topic.contributors.length > 0 && (
                            <div className="mt-3">
                              <div className="flex -space-x-2">
                                {topic.contributors.map((contributor, index) => (
                                  <Image
                                    key={index}
                                    src={contributor.photoURL || '/default-avatar.png'}
                                    alt={contributor.name}
                                    width={24}
                                    height={24}
                                    className="rounded-full border-2 border-white"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {(!userData.topics || userData.topics.length === 0) && (
                      <div className="col-span-full flex flex-col items-center justify-center  border-dashed rounded-lg">
                        <p className="mb-4 text-gray-500">You don't have any topics yet</p>
                        <Button onClick={handleAddTopic}>
                          <FaPlus className="mr-2" /> Create Your First Topic
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-end justify-end overflow-x-auto">
                    {userData.topics && userData.topics.map((topic) => (
                      <Button
                        key={topic._id}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "mr-2 whitespace-nowrap border-b-2 border-transparent rounded-none",
                          activeTab === topic._id ? "border-primary" : ""
                        )}
                        onClick={() => handleTopicSelect(topic._id)}
                      >
                        {topic.name.toLowerCase()}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 rounded-none"
                      onClick={handleAddTopic}
                    >
                      +
                    </Button>
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <h1 className="">{currentTopic?.name || 'Topic'}</h1>
                      <Button variant="ghost" size="sm" className="ml-2" onClick={() => handleEditTopic(activeTab, currentTopic?.name || '')}>
                        <MdEdit className="h-5 w-5" />
                      </Button>
                    </div>
                    <div>
                      <Image 
                        src={userData?.photoURL || '/default-avatar.png'}
                        alt={userData?.name || 'User'}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    </div>
                  </div>
                  
                  
                  
                  
                  {!currentTopic ? (
                    <div className="p-8 border rounded-lg text-center">
                      <p>Please select a topic first</p>
                    </div>
                  ) : activeView === 'materials' ? (
                    <>
                      <MaterialsView 
                        categories={currentTopic.categories || {
                          webpage: [],
                          video: [],
                          podcast: [],
                          book: []
                        }}
                        onAddMaterial={handleAddMaterial}
                        onDeleteMaterial={async (materialId, topicId) => {
                          try {
                            const success = await deleteMaterial(materialId, topicId || activeTab);
                            if (!success) throw new Error('Failed to delete material');
                            return true;
                          } catch (error) {
                            console.error('Error deleting material:', error);
                            return false;
                          }
                        }}
                        onUpdateMaterial={async (materialId, updates) => {
                          try {
                            const user = auth.currentUser;
                            if (!user) throw new Error('No user logged in');
                            
                            if (updates.completed) {
                              await completeMaterial(materialId, activeTab);
                            } else {
                              await updateMaterialProgress(materialId, activeTab, {
                                completedUnits: updates.completedUnits as number,
                                completed: updates.completed as boolean,
                                readingTime: updates.readingTime as number
                              });
                            }
                            
                            return true;
                          } catch (error) {
                            console.error('Error updating material:', error);
                            return false;
                          }
                        }}
                        activeTab={activeTab}
                        onReorderMaterials={handleReorderMaterials}
                        getCustomMaterials={(materials) => getDisplayMaterials(activeTab, materials)}
                      />
                    </>
                  ) : (
                    <>
                      <StudyListView 
                        categories={currentTopic.categories || {
                          webpage: [],
                          video: [],
                          podcast: [],
                          book: []
                        }}
                        onCompleteMaterial={async (materialId, isCompleted) => {
                          try {
                            if (isCompleted) {
                              await uncompleteMaterial(materialId, activeTab);
                            } else {
                              await completeMaterial(materialId, activeTab);
                            }
                          } catch (error) {
                            console.error('Error completing material:', error);
                          }
                        }}
                        unitMinutes={unitMinutes}
                        onUnitMinutesChange={setUnitMinutes}
                        topicId={activeTab}
                        onUpdateMaterial={async (materialId, updates) => {
                          try {
                            const user = auth.currentUser;
                            if (!user) throw new Error('No user logged in');
                            
                            if (updates.completed) {
                              await completeMaterial(materialId, activeTab);
                            } else {
                              await updateMaterialProgress(materialId, activeTab, {
                                completedUnits: updates.completedUnits as number,
                                completed: updates.completed as boolean,
                                readingTime: updates.readingTime as number
                              });
                            }
                            
                            await fetchUserData(user);
                            return true;
                          } catch (error) {
                            console.error('Error in onUpdateMaterial:', error);
                            return false;
                          }
                        }}
                        onReorderMaterials={handleReorderMaterials}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditProfileDialog 
        open={isEditing} 
        onOpenChange={setIsEditing}
        onSave={handleSaveProfile}
        initialName={userData?.name || ''}
        initialBio={userData?.bio || ''}
      />

      {deleteConfirmation.isOpen && (
        <div className={styles.confirmationDialog}>
          <div className={styles.dialogContent}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this topic? This action cannot be undone.</p>
            <div className={styles.dialogButtons}>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
              <Button variant="outline" onClick={handleCancelDelete}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}