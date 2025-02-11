import { useState } from 'react';
import { Material, Categories } from '../../types/User';
import styles from './MaterialsView.module.css';
import { LuGlobe } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { MdWeb } from "react-icons/md";
import { BsGrid } from "react-icons/bs";
import { IoChevronDownSharp } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineEdit } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { auth } from '../firebase/firebaseConfig';

interface MaterialsViewProps {
  categories: Categories;
  onAddMaterial: (material: any) => void;
  onDeleteMaterial: (materialId: string) => Promise<boolean>;
  onUpdateMaterial: (materialId: string, title: string) => Promise<boolean>;
  activeTab: string;
}

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

  const MoreMenu = ({ 
    materialId, 
    title,
    type,
    onClose,
    index
  }: { 
    materialId: string, 
    title: string,
    type: keyof Categories,
    onClose: () => void,
    index: number
  }) => {
    const handleDelete = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('No user logged in');
        }

        console.log('Attempting to delete material:', {
          userId: user.uid,
          topicId: activeTab,
          materialId,
          type,
          index
        });

        const token = await user.getIdToken();
        const url = `/api/materials/${user.uid}/topics/${activeTab}/materials/${materialId}?type=${type}&index=${index}`;
        
        console.log('Delete request URL:', url);

        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Delete response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Delete error response:', errorText);
          throw new Error(`Failed to delete material: ${errorText}`);
        }

        await onDeleteMaterial(materialId);
        onClose();
      } catch (error) {
        console.error('Error deleting material:', error);
        throw error;
      }
    };

    const handleEdit = () => {
      setEditingMaterial(materialId);
      setEditedTitle(title);
      onClose();
    };

    return (
      <div className={styles.moreMenu}>
        <button 
          className={styles.moreMenuItem}
          onClick={handleEdit}
        >
          <div className={styles.menuIconContainer}>
            <MdOutlineEdit size={18} />
          </div>
        </button>
        <button 
          className={styles.moreMenuItem}
          onClick={handleDelete}
        >
          <div className={styles.menuIconContainer}>
            <RiDeleteBin6Line size={18} />
          </div>
        </button>
        <button 
          className={styles.moreMenuItem}
          onClick={onClose}
        >
          <div className={styles.menuIconContainer}>
            <IoClose size={18} />
          </div>
        </button>
      </div>
    );
  };

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
    <div className={styles.materialsContainer}>
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

      <div className={styles.materialsList}>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          onAddMaterial({
            title: formData.get('title'),
            type: selectedType,
            url: formData.get('url'),
            rating: 5
          });
          (e.target as HTMLFormElement).reset();
        }} className={styles.addForm}>
          <div className={styles.addMaterialRow}>
            <div className={styles.addButtonContainer}>
              <button type="submit" className={styles.addButton}>+</button>
            </div>
            <div className={styles.typeIconContainer}>
              {categoryIcons[selectedType]}
              <button 
                type="button" 
                className={styles.dropdownButton}
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              >
                <IoChevronDownSharp size={14} />
              </button>
              {isTypeDropdownOpen && (
                <div className={styles.typeDropdown}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.typeOptions}>
                      <button
                        type="button"
                        className={styles.typeOption}
                        onClick={() => {
                          setSelectedType('webpage');
                          setIsTypeDropdownOpen(false);
                        }}
                      >
                        <MdWeb size={18} />
                      </button>
                      <button
                        type="button"
                        className={styles.typeOption}
                        onClick={() => {
                          setSelectedType('video');
                          setIsTypeDropdownOpen(false);
                        }}
                      >
                        <FiVideo size={18} />
                      </button>
                      <button
                        type="button"
                        className={styles.typeOption}
                        onClick={() => {
                          setSelectedType('podcast');
                          setIsTypeDropdownOpen(false);
                        }}
                      >
                        <HiOutlineMicrophone size={16} />
                      </button>
                      <button
                        type="button"
                        className={styles.typeOption}
                        onClick={() => {
                          setSelectedType('book');
                          setIsTypeDropdownOpen(false);
                        }}
                      >
                        <FiBook size={18} />
                      </button>
                    </div>
                    <button 
                      type="button"
                      className={styles.closeButton}
                      onClick={() => setIsTypeDropdownOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.inputGroup}>
              <input
                type="text"
                name="title"
                placeholder="Add Material..."
                className={styles.addInput}
                required
              />
              <input
                type="url"
                name="url"
                placeholder="Url(Optional)"
                className={styles.urlInput}
              />
            </div>
          </div>
        </form>

        <div className={styles.materialsListContent}>
          {getAllMaterials().map((material, index) => (
            <div key={index} className={styles.materialItem}>
              <div className={styles.materialLeft}>
                <span className={styles.materialNumber}>{index + 1}</span>
                <div className={styles.materialPreview}>
                  <div className={styles.previewPlaceholder} />
                </div>
                {editingMaterial === material._id ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const success = await onUpdateMaterial(material._id!, editedTitle);
                    if (success) {
                      setEditingMaterial(null);
                    } else {
                      console.error('Failed to update material');
                    }
                  }}>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className={styles.editInput}
                      autoFocus
                    />
                  </form>
                ) : (
                  <span className={styles.materialName}>{material.title}</span>
                )}
              </div>
              <div className={styles.moreButtonContainer}>
                <button 
                  className={styles.moreButton}
                  onClick={() => setOpenMoreMenu(material._id ? material._id : null)}
                >
                  ⋯
                </button>
                {openMoreMenu === material._id && (
                  <MoreMenu
                    materialId={material._id!}
                    title={material.title}
                    type={material.type as keyof Categories}
                    onClose={() => setOpenMoreMenu(null)}
                    index={index}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}