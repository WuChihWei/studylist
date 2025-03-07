import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Material, Categories, Contributions } from '@/types/User';
import styles from './MaterialsView.module.css';
import { LuGlobe } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { MdWeb } from "react-icons/md";
import { BsGrid, BsListUl } from "react-icons/bs";
import { IoChevronDownSharp } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineEdit } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { auth } from '../firebase/firebaseConfig';
import { useUserData } from '../../hooks/useUserData';
import { IconType } from 'react-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Plus, MoreHorizontal, Link, Pencil, Trash2 } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { NoteCard } from "@/app/components/ui/NoteCard"
import UnifiedTableView from '../components/UnifiedTableView';
import { cn } from "@/lib/utils"

interface MaterialInput {
  title: string;
  type: 'webpage' | 'video' | 'podcast' | 'book';
  url?: string;
  rating?: number;
  dateAdded: Date;
  order?: number; // 新增 order 欄位
}

interface MaterialsViewProps {
  // 改為直接使用 materials 陣列而不是 categories 物件
  materials: Material[];
  contributions?: Contributions;
  onAddMaterial: (material: MaterialInput) => Promise<boolean>;
  onDeleteMaterial: (materialId: string, topicId: string) => Promise<boolean>;
  onUpdateMaterial: (materialId: string, updates: Partial<Material>) => Promise<boolean>;
  activeTab: string;
  onReorderMaterials?: (materials: Material[]) => Promise<void>;
  getCustomMaterials?: (materials: Material[]) => Material[];
}

export const TYPE_ICONS: Record<string, IconType> = {
  video: FiVideo,
  book: FiBook,
  podcast: HiOutlineMicrophone,
  webpage: LuGlobe
};

const truncateTitle = (title: string, maxLength: number = 40) => {
  if (!title) return '';
  return title.length <= maxLength ? title : `${title.slice(0, maxLength)}...`;
};

export default function MaterialsView({ 
  materials, 
  contributions,
  onAddMaterial, 
  onDeleteMaterial, 
  onUpdateMaterial, 
  activeTab,
  onReorderMaterials,
  getCustomMaterials
}: MaterialsViewProps) {
  const [activeView, setActiveView] = useState<'materials' | 'studylist'>('materials');
  const [activeCategory, setActiveCategory] = useState<'all' | 'webpage' | 'video' | 'podcast' | 'book'>('all');
  const [selectedType, setSelectedType] = useState<'webpage' | 'video' | 'podcast' | 'book'>('webpage');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [notePopup, setNotePopup] = useState<{
    isOpen: boolean;
    materialId: string;
    title: string;
    note: string;
  }>({
    isOpen: false,
    materialId: '',
    title: '',
    note: ''
  });
  const [reorderCounter, setReorderCounter] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const categoryIcons = {
    all: <span className={styles.categoryIcon}><BsGrid size={18} /></span>,
    webpage: <span className={styles.categoryIcon}><MdWeb size={18} /></span>,
    video: <span className={styles.categoryIcon}><FiVideo size={18} /></span>,
    podcast: <span className={styles.categoryIcon}><HiOutlineMicrophone size={16} /></span>,
    book: <span className={styles.categoryIcon}><FiBook size={18} /></span>
  };

  // 重新實現 getCategoryCount 方法，使用 filter 來計算各類別的數量
  const getCategoryCount = (category: string) => {
    if (category === 'all') {
      return materials.length;
    }
    return materials.filter(material => material.type === category).length;
  };

  // 重新實現 getAllMaterials 方法，使用 filter 來獲取各類別的材料
  const getAllMaterials = () => {
    // 根據活動類別過濾材料
    let filteredMaterials: Material[];
    
    if (activeCategory === 'all') {
      filteredMaterials = materials;
    } else {
      filteredMaterials = materials.filter(material => material.type === activeCategory);
    }
    
    // 如果提供了自定義材料獲取函數，使用它
    if (getCustomMaterials) {
      return getCustomMaterials(filteredMaterials);
    } else {
      // 否則按 order 字段排序
      return filteredMaterials.sort((a, b) => a.order - b.order);
    }
  };

  const data = useMemo(() => {
    return getAllMaterials().map((material, index) => ({
      ...material,
      index: index + 1
    }));
  }, [materials, activeCategory, getCustomMaterials, reorderCounter, refreshKey]);

  const MoreMenu = ({ 
    materialId, 
    title,
    type,
    onClose,
    onDelete
  }: { 
    materialId: string, 
    title: string,
    type: 'webpage' | 'video' | 'podcast' | 'book',
    onClose: () => void,
    onDelete: () => Promise<boolean>
  }) => {
    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        console.log('Deleting material:', { materialId, title, type });
        const success = await onDelete();
        if (success) {
          onClose();
        }
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    };

    return (
      <div className={styles.moreMenu}>
        <Button
          variant="ghost"
          size="sm"
          className={styles.moreMenuItem}
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={styles.moreMenuItem}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <IoClose className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // 點擊外部時關閉 MoreMenu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMoreMenu && !(event.target as Element).closest('.moreMenu')) {
        setOpenMoreMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMoreMenu]);

  const isOnline = () => {
    return typeof window !== 'undefined' && window.navigator.onLine;
  };

  const fetchUserData = async (currentUser: any) => {
    if (isLoading) return;
    
    try {
      setLoading(true);
      
      if (!isOnline()) {
        console.log('Offline - using cached data if available');
        const cacheKey = `userData_${currentUser.uid}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        
        if (cachedData) {
          const { data } = JSON.parse(cachedData);
          setUserData(data);
          return;
        }
        throw new Error('No cached data available and device is offline');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/users/${currentUser.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const cacheKey = `userData_${currentUser.uid}`;
      
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // 更新 handleReorderItems 方法以適應新的資料結構
  const handleReorderItems = async (reorderedItems: (Material & { index: number })[]) => {
    console.log('🧩 handleReorderItems 開始執行，收到項目數量:', reorderedItems.length);
    
    // 確保所有項目都有正確的 order 屬性
    const itemsWithOrder = reorderedItems.map((item, idx) => ({
      ...item,
      order: idx // 確保 order 屬性與當前位置一致
    }));
    
    // 立即更新本地UI，不等待服務器響應
    setReorderCounter(prev => prev + 1);
    
    // 保存當前重新排序的項目到 localStorage
    const orderMap = new Map<string, number>();
    try {
      itemsWithOrder.forEach((item, index) => {
        if (item._id) {
          orderMap.set(item._id, index);
        }
      });
      localStorage.setItem(`temp_order_${activeTab}`, JSON.stringify(Array.from(orderMap.entries())));
    } catch (error) {
      console.error(' 保存臨時順序到 localStorage 失敗:', error);
    }
    
    // 使用 getCustomMaterials 更新本地數據
    if (getCustomMaterials) {
      const customMaterials = getCustomMaterials(itemsWithOrder);
      setRefreshKey(prev => prev + 1);
      setReorderCounter(prev => prev + 1);
      
      // 延遲 50ms 後再次強制刷新
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
        setReorderCounter(prev => prev + 1);
        
        // 觸發 materialReordered 事件
        const event = new CustomEvent('materialReordered', { 
          detail: { topicId: activeTab } 
        });
        window.dispatchEvent(event);
      }, 50);
    }
    
    // 調用 onReorderMaterials 更新服務器數據
    if (onReorderMaterials) {
      try {
        await onReorderMaterials(itemsWithOrder);
        localStorage.setItem(`order_${activeTab}`, JSON.stringify(Array.from(orderMap.entries())));
      } catch (error) {
        console.error(' 重排序請求失敗:', error);
        alert('重新排序失敗，請稍後再試');
      }
    }
  };

  // Add useEffect to refresh the component when reordering occurs
  useEffect(() => {
    if (reorderCounter > 0) {
      console.log('🔄 MaterialsView - 強制刷新頁面，reorderCounter:', reorderCounter);
      setRefreshKey(prev => prev + 1);
    }
  }, [reorderCounter]);
  
  // Add event listener for material-reorder event
  useEffect(() => {
    const handleMaterialReorder = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.topicId === activeTab) {
        console.log('🔄 MaterialsView - 收到 material-reorder 事件，強制刷新');
        setRefreshKey(prev => prev + 1);
      }
    };
    
    window.addEventListener('material-reorder', handleMaterialReorder);
    
    return () => {
      window.removeEventListener('material-reorder', handleMaterialReorder);
    };
  }, [activeTab]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.categoriesContainer}>
            <div className={styles.categoryTabs}>
              <button
                className={cn(
                  styles.categoryTab,
                  activeCategory === 'all' ? cn(styles.active, 'font-bold text-black') : 'text-gray-400'
                )}
                onClick={() => setActiveCategory('all')}
              >
                {categoryIcons.all}
                <span>All ({getCategoryCount('all')})</span>
              </button>
              <button
                className={cn(
                  styles.categoryTab,
                  activeCategory === 'webpage' ? cn(styles.active, 'font-bold text-black') : 'text-gray-400'
                )}
                onClick={() => setActiveCategory('webpage')}
              >
                {categoryIcons.webpage}
                <span>Web ({getCategoryCount('webpage')})</span>
              </button>
              <button
                className={cn(
                  styles.categoryTab,
                  activeCategory === 'video' ? cn(styles.active, 'font-bold text-black') : 'text-gray-400'
                )}
                onClick={() => setActiveCategory('video')}
              >
                {categoryIcons.video}
                <span>Video ({getCategoryCount('video')})</span>
              </button>
              <button
                className={cn(
                  styles.categoryTab,
                  activeCategory === 'podcast' ? cn(styles.active, 'font-bold text-black') : 'text-gray-400'
                )}
                onClick={() => setActiveCategory('podcast')}
              >
                {categoryIcons.podcast}
                <span>Podcast ({getCategoryCount('podcast')})</span>
              </button>
              <button
                className={cn(
                  styles.categoryTab,
                  activeCategory === 'book' ? cn(styles.active, 'font-bold text-black') : 'text-gray-400'
                )}
                onClick={() => setActiveCategory('book')}
              >
                {categoryIcons.book}
                <span>Book ({getCategoryCount('book')})</span>
              </button>
            </div>
            <div className={styles.viewToggle}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={cn(
                  styles.viewToggleButton,
                  viewMode === 'list' ? 'font-bold text-black' : 'text-gray-400'
                )}
              >
                <BsListUl size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={cn(
                  styles.viewToggleButton,
                  viewMode === 'grid' ? 'font-bold text-black' : 'text-gray-400'
                )}
              >
                <BsGrid size={18} />
              </Button>
            </div>
          </div>
        </div>
        <div className={styles.materials}>
          <UnifiedTableView
            key={`materials-${activeTab}-${Date.now()}`}
            materials={data}
            viewType="materials"
            viewMode={viewMode}
            onEdit={(material) => {
              setNotePopup({
                isOpen: true,
                materialId: material._id || '',
                title: material.title || '',
                note: material.note || ''
              });
            }}
            onDelete={async (materialId) => {
              console.log('Delete material called with ID:', materialId, 'and topicId:', activeTab);
              if (!activeTab) {
                console.error('No active tab/topicId available for delete operation');
                return false;
              }
              return await onDeleteMaterial(materialId, activeTab);
            }}
            onReorderItems={onReorderMaterials ? handleReorderItems : undefined}
          />
          
        </div>
      </div>
      
      {/* Note Popup */}
      <NoteCard
        isOpen={notePopup.isOpen}
        onClose={() => setNotePopup(prev => ({ ...prev, isOpen: false }))}
        title={notePopup.title}
        note={notePopup.note}
        onSave={async (note) => {
          if (notePopup.materialId) {
            const success = await onUpdateMaterial(notePopup.materialId, { note });
            if (success) {
              setNotePopup(prev => ({ ...prev, isOpen: false }));
            }
          }
        }}
      />
    </div>
  );
}
