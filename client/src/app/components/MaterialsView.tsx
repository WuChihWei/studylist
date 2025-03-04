import React, { useState, useMemo, useEffect } from 'react';
import { Material, Categories } from '@/types/User';
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
import UnifiedTableView from './UnifiedTableView';

interface MaterialInput {
  title: string;
  type: keyof Categories;
  url?: string;
  rating?: number;
  dateAdded: Date;
}

interface MaterialsViewProps {
  categories: Categories;
  onAddMaterial: (material: MaterialInput) => Promise<boolean>;
  onDeleteMaterial: (materialId: string, topicId: string) => Promise<boolean>;
  onUpdateMaterial: (materialId: string, updates: Partial<Material>) => Promise<boolean>;
  activeTab: string;
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

export default function MaterialsView({ categories, onAddMaterial, onDeleteMaterial, onUpdateMaterial, activeTab }: MaterialsViewProps) {
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

  const categoryIcons = {
    all: <span className={styles.categoryIcon}><BsGrid size={18} /></span>,
    webpage: <span className={styles.categoryIcon}><MdWeb size={18} /></span>,
    video: <span className={styles.categoryIcon}><FiVideo size={18} /></span>,
    podcast: <span className={styles.categoryIcon}><HiOutlineMicrophone size={16} /></span>,
    book: <span className={styles.categoryIcon}><FiBook size={18} /></span>
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') {
      return categories.webpage.length + 
             categories.video.length + 
             categories.podcast.length + 
             categories.book.length;
    }
    return categories[category as keyof Categories]?.length || 0;
  };

  const getAllMaterials = () => {
    if (activeCategory === 'all') {
      return [
        ...categories.webpage.map(m => ({ ...m, type: 'webpage' })),
        ...categories.video.map(m => ({ ...m, type: 'video' })),
        ...categories.podcast.map(m => ({ ...m, type: 'podcast' })),
        ...categories.book.map(m => ({ ...m, type: 'book' }))
      ];
    }
    return categories[activeCategory].map(m => ({ ...m, type: activeCategory }));
  };

  const data = useMemo(() => {
    return getAllMaterials().map((material, index) => ({
      ...material,
      index: index + 1,
      type: material.type as Material['type']
    }));
  }, [categories, activeCategory]);

  const MoreMenu = ({ 
    materialId, 
    title,
    type,
    onClose,
    onDelete
  }: { 
    materialId: string, 
    title: string,
    type: keyof Categories,
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

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.categoriesContainer}>
            <div className={styles.categoryTabs}>
              <button
                className={`${styles.categoryTab} ${activeCategory === 'all' ? styles.active : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                {categoryIcons.all}
                <span>All ({getCategoryCount('all')})</span>
              </button>
              <button
                className={`${styles.categoryTab} ${activeCategory === 'webpage' ? styles.active : ''}`}
                onClick={() => setActiveCategory('webpage')}
              >
                {categoryIcons.webpage}
                <span>Web ({getCategoryCount('webpage')})</span>
              </button>
              <button
                className={`${styles.categoryTab} ${activeCategory === 'video' ? styles.active : ''}`}
                onClick={() => setActiveCategory('video')}
              >
                {categoryIcons.video}
                <span>Video ({getCategoryCount('video')})</span>
              </button>
              <button
                className={`${styles.categoryTab} ${activeCategory === 'podcast' ? styles.active : ''}`}
                onClick={() => setActiveCategory('podcast')}
              >
                {categoryIcons.podcast}
                <span>Podcast ({getCategoryCount('podcast')})</span>
              </button>
              <button
                className={`${styles.categoryTab} ${activeCategory === 'book' ? styles.active : ''}`}
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
                className={viewMode === 'list' ? styles.activeView : ''}
              >
                <BsListUl size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? styles.activeView : ''}
              >
                <BsGrid size={18} />
              </Button>
            </div>
          </div>
        </div>
        <div className={styles.materials}>
          <UnifiedTableView
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
          />
          
          {/* Add Material Form */}
          {/* <div className={styles.addFormContainer}>
            <div className={styles.addForm}>
              <div className={styles.addMaterialRow}>
                <div className={styles.inputGroup}>
                  <div className={styles.typeIconContainer}>
                    {TYPE_ICONS[selectedType]({ size: 16, color: '#666' })}
                  </div>
                  <input
                    type="text"
                    placeholder="Add new material..."
                    className={styles.addInput}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onFocus={() => setShowUrlInput(true)}
                  />
                </div>
                <div className={styles.addButtonContainer}>
                  <button
                    className={styles.addButton}
                    onClick={async () => {
                      if (editedTitle.trim()) {
                        const newMaterial = {
                          title: editedTitle,
                          type: selectedType,
                          url: '',
                          dateAdded: new Date()
                        };
                        const success = await onAddMaterial(newMaterial);
                        if (success) {
                          setEditedTitle('');
                          setShowUrlInput(false);
                        }
                      }
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              {showUrlInput && (
                <div className={styles.urlInputRow}>
                  <div className={styles.inputGroup}>
                    <div className={styles.typeDropdownTrigger} onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}>
                      <div className={styles.selectedType}>
                        {TYPE_ICONS[selectedType]({ size: 16, color: '#666' })}
                        <span>{selectedType}</span>
                      </div>
                      <IoChevronDownSharp size={12} />
                    </div>
                    <input
                      type="text"
                      placeholder="URL (optional)"
                      className={styles.urlInput}
                    />
                  </div>
                  {isTypeDropdownOpen && (
                    <div className={styles.typeDropdown}>
                      <div className={styles.dropdownHeader}>
                        <span>Select Type</span>
                        <button
                          className={styles.closeButton}
                          onClick={() => setIsTypeDropdownOpen(false)}
                        >
                          <IoClose size={16} />
                        </button>
                      </div>
                      <div className={styles.typeOptions}>
                        {Object.keys(TYPE_ICONS).map((type) => (
                          <button
                            key={type}
                            className={`${styles.typeOption} ${selectedType === type ? styles.selected : ''}`}
                            onClick={() => {
                              setSelectedType(type as 'webpage' | 'video' | 'podcast' | 'book');
                              setIsTypeDropdownOpen(false);
                            }}
                          >
                            {TYPE_ICONS[type as keyof typeof TYPE_ICONS]({ size: 16, color: selectedType === type ? '#fff' : '#666' })}
                            <span>{type}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div> */}
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
