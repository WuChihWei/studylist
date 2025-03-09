"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUserData } from '@/hooks/useUserData';
import styles from './profile.module.css';
import Image from 'next/image';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useRouter, useSearchParams } from 'next/navigation';
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
import Contribution from '@/app/profile/Contribution';
import LearningGraph from '@/app/profile/LearningGraph';
import Topics from '@/app/profile/Topics';
import Materials from '@/app/profile/Materials';

// Tab definitions
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'topics', label: 'Topics' },
  { id: 'materials', label: 'Materials' },
  { id: 'contributions', label: 'Contributions' },
  { id: 'learning', label: 'Learning Graph' },
];

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
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 添加缺失的状态变量
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editedTopicName, setEditedTopicName] = useState('');
  
  // 定義 API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
  
  // 重定义handleTabChange函数
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/profile?tab=${tabId}`);
  };

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

  useEffect(() => {
    if (userData && userData.topics) {
      console.log('🔍 用戶的所有主題:', userData.topics.map(t => ({ id: t._id, name: t.name })));
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
      // 計算新材料的 order
      let newOrder = 0;
      if (userData && userData.topics && userData.topics.length > 0 && activeTab) {
        const currentTopic = userData.topics.find(t => t._id === activeTab);
        if (currentTopic) {
          // 如果使用新的數據結構
          if (currentTopic.materials) {
            newOrder = currentTopic.materials.length;
          } 
          // 如果使用舊的數據結構
          else if (currentTopic.categories) {
            const totalMaterials = 
              (currentTopic.categories.webpage?.length || 0) +
              (currentTopic.categories.video?.length || 0) +
              (currentTopic.categories.podcast?.length || 0) +
              (currentTopic.categories.book?.length || 0);
            newOrder = totalMaterials;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
      
      console.log('🔍 準備添加材料，order:', newOrder);
      // 只在開發環境中輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 準備添加材料，favicon:', material.favicon);
      }
      const success = await addMaterial({
        title: material.title.trim(),
        type: material.type,
        url: material.url?.trim(),
        rating: material.rating || 5,
        dateAdded: new Date(),
        order: newOrder, // 設置新材料的 order
        favicon: material.favicon // 添加 favicon
      }, activeTab);
      
      return success === true;
    } catch (error) {
      console.error('🔍 添加材料錯誤:', error);
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

  // 添加導航到學習路徑頁面的函數
  const handleNavigateToLearningPath = () => {
    // 如果有活動的主題，則將其作為參數傳遞
    if (activeTab) {
      router.push(`/profile/learning-path?topicId=${activeTab}`);
    } else {
      router.push('/profile/learning-path');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!userData) return <div>Please log in</div>;
  
  const currentTopic = userData?.topics?.find(t => t._id === activeTab);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* User profile header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
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
          <div className="ml-6">
            <h1 className="text-2xl font-bold">
              {userData?.name || 'User Profile'}
            </h1>
            <div className="flex items-center mt-1 text-gray-600">
              <span className="text-sm">
                Total contribution: <span className="font-semibold">
                  {userData?.contributions?.reduce((total, item) => total + (item.count || 0), 0) || 0}
                </span> mins
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Recent Contributions</h3>
                <Contribution limit={3} />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">Learning Progress</h3>
                <LearningGraph limit={5} />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'topics' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Topics</h2>
            <Topics />
          </div>
        )}
        
        {activeTab === 'materials' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Learning Materials</h2>
            <Materials />
          </div>
        )}
        
        {activeTab === 'contributions' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Contribution History</h2>
            <Contribution />
          </div>
        )}
        
        {activeTab === 'learning' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Learning Graph</h2>
            <LearningGraph />
          </div>
        )}
      </div>
    </div>
  );
}