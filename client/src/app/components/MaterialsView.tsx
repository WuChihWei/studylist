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

interface MaterialsViewProps {
  categories: Categories;
  onAddMaterial: (material: any) => void;
  onDeleteMaterial: (materialId: string) => Promise<boolean>;
  onUpdateMaterial: (materialId: string, title: string) => Promise<boolean>;
}

export default function MaterialsView({ categories, onAddMaterial, onDeleteMaterial, onUpdateMaterial }: MaterialsViewProps) {
  const [activeView, setActiveView] = useState<'materials' | 'studylist'>('materials');
  const [activeCategory, setActiveCategory] = useState<'all' | 'webpage' | 'video' | 'podcast' | 'book'>('all');
  const [selectedType, setSelectedType] = useState<'webpage' | 'video' | 'podcast' | 'book'>('webpage');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');

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
    onClose 
  }: { 
    materialId: string, 
    title: string,
    onClose: () => void 
  }) => {
    const handleDelete = async () => {
      try {
        const success = await onDeleteMaterial(materialId);
        if (success) {
          onClose();
        } else {
          console.error('Failed to delete material');
        }
      } catch (error) {
        console.error('Error deleting material:', error);
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
          <span>Edit</span>
        </button>
        <button 
          className={styles.moreMenuItem}
          onClick={handleDelete}
        >
          <div className={styles.menuIconContainer}>
            <RiDeleteBin6Line size={18} />
          </div>
          <span>Delete</span>
        </button>
      </div>
    );
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
                      {Object.entries(categoryIcons).map(([type, icon]) => (
                        type !== 'all' && (
                          <button
                            key={type}
                            type="button"
                            className={styles.typeOption}
                            onClick={() => {
                              setSelectedType(type as 'webpage' | 'video' | 'podcast' | 'book');
                              setIsTypeDropdownOpen(false);
                            }}
                          >
                            {icon}
                          </button>
                        )
                      ))}
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
                    onClose={() => setOpenMoreMenu(null)}
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