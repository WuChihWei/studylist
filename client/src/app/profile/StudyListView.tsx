import { useState, useEffect } from 'react';
import { Material, Categories } from '../../types/User';
import styles from './StudyListView.module.css';
import { LuGlobe } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { FaCheck, FaTimes, FaPlay } from "react-icons/fa";
import CircleProgress from '../components/ui/circleProgress';
import VideoPopup from '../components/VideoPopup';
import UnifiedTableView from '../components/UnifiedTableView';

interface StudyListViewProps {
  categories: Categories;
  onCompleteMaterial: (materialId: string, isCompleted: boolean) => Promise<void>;
  unitMinutes: number;
  onUnitMinutesChange: (minutes: number) => void;
  topicId: string;
  onUpdateMaterial: (materialId: string, updates: Partial<Material>) => Promise<boolean>;
  onReorderMaterials?: (materials: Material[]) => Promise<void>;
}

export default function StudyListView({ 
  categories, 
  onCompleteMaterial,
  unitMinutes = 6,
  onUnitMinutesChange,
  topicId,
  onUpdateMaterial,
  onReorderMaterials
}: StudyListViewProps) {
  const [completedMaterials, setCompletedMaterials] = useState<Set<string>>(() => {
    const completed = new Set<string>();
    
    if (categories.webpage) {
      categories.webpage.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.video) {
      categories.video.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.podcast) {
      categories.podcast.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.book) {
      categories.book.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    
    return completed;
  });
  
  const [contentPopup, setContentPopup] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    title: ''
  });

  useEffect(() => {
    const completed = new Set<string>();
    
    if (categories.webpage) {
      categories.webpage.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.video) {
      categories.video.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.podcast) {
      categories.podcast.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.book) {
      categories.book.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    
    setCompletedMaterials(completed);
  }, [categories]);

  const typeIcons = {
    webpage: <LuGlobe size={20} />,
    video: <FiVideo size={20} />,
    podcast: <HiOutlineMicrophone size={20} />,
    book: <FiBook size={20} />
  };

  const estimateTimeUnits = (material: Material & { type: keyof Categories }) => {
    if (material.readingTime) {
      return Math.ceil(material.readingTime / unitMinutes);
    }
    
    // Default units based on content type if not specified
    switch (material.type) {
      case 'video': return 6;
      case 'podcast': return 8;
      case 'book': return 12;
      case 'webpage': return 3;
      default: return 4;
    }
  };

  const getAllMaterials = () => {
    return [
      ...categories.webpage.map(m => ({ ...m, type: 'webpage' as const })),
      ...categories.video.map(m => ({ ...m, type: 'video' as const })),
      ...categories.podcast.map(m => ({ ...m, type: 'podcast' as const })),
      ...categories.book.map(m => ({ ...m, type: 'book' as const }))
    ];
  };

  const handleComplete = async (material: Material) => {
    if (!material._id) return;
    
    const isCurrentlyCompleted = completedMaterials.has(material._id);
    
    try {
      await onCompleteMaterial(material._id, !isCurrentlyCompleted);
      
      // Update local state
      const newCompleted = new Set(completedMaterials);
      if (isCurrentlyCompleted) {
        newCompleted.delete(material._id);
      } else {
        newCompleted.add(material._id);
      }
      setCompletedMaterials(newCompleted);
    } catch (error) {
      console.error('Error toggling completion status:', error);
    }
  };

  const handleUnitComplete = async (material: Material & { type: keyof Categories }, clickedIndex: number) => {
    if (!material._id) return;
    
    const totalUnits = estimateTimeUnits(material);
    const currentCompleted = material.completedUnits || 0;
    
    // If clicking on a completed unit, mark it and all after it as incomplete
    if (clickedIndex < currentCompleted) {
      await onUpdateMaterial(material._id, {
        completedUnits: clickedIndex,
        completed: false
      });
    } 
    // If clicking on the last uncompleted unit, mark all as complete
    else if (clickedIndex === totalUnits - 1) {
      await onUpdateMaterial(material._id, {
        completedUnits: totalUnits,
        completed: true
      });
      
      // Update local state
      const newCompleted = new Set(completedMaterials);
      newCompleted.add(material._id);
      setCompletedMaterials(newCompleted);
    } 
    // Otherwise mark up to the clicked unit as complete
    else {
      await onUpdateMaterial(material._id, {
        completedUnits: clickedIndex + 1,
        completed: false
      });
    }
  };

  const handleOpenContent = (material: Material & { type: keyof Categories }) => {
    if (!material.url) return;
    
    if (material.type === 'video') {
      setContentPopup({
        isOpen: true,
        url: material.url,
        title: material.title || ''
      });
    } else {
      window.open(material.url, '_blank');
    }
  };

  const handlePlayClick = (material: Material & { type: keyof Categories }) => {
    handleOpenContent(material);
  };

  const data = getAllMaterials().map((material, index) => ({
    ...material,
    index: index + 1,
    type: material.type
  }));

  // Add this function to handle reordering
  const handleReorderItems = async (reorderedItems: (Material & { type: keyof Categories; index: number })[]) => {
    console.log('📚 StudyListView - handleReorderItems 開始', reorderedItems.map(item => `${item._id}:${item.index}`));
    
    // Group the items by type
    const reorderedByType: Categories = {
      webpage: [],
      video: [],
      book: [],
      podcast: []
    };

    // Reorganize items by type but preserve the index and order
    reorderedItems.forEach((item, idx) => {
      if (reorderedByType[item.type]) {
        // Keep the index property and add an order property based on the current position
        reorderedByType[item.type].push({
          ...item,
          order: idx, // Add order property based on the current position in the array
          index: item.index // Preserve the original index property
        } as Material & { type: keyof Categories; index: number });
      }
    });

    // Call the parent component's reorder function if available
    if (onReorderMaterials) {
      // Flatten the categories into a single array, preserving the order
      const allMaterials = [
        ...reorderedByType.webpage,
        ...reorderedByType.video,
        ...reorderedByType.podcast,
        ...reorderedByType.book
      ].sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order
      
      console.log('📚 StudyListView - 調用 onReorderMaterials', allMaterials.map(item => `${item._id}:${item.order}`));
      await onReorderMaterials(allMaterials);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {/* <h2 className={styles.title}>Study List</h2> */}
          <div className={styles.unitMinutesInput}>
            <input
              type="number"
              min="1"
              max="120"
              value={unitMinutes}
              placeholder="6"
              onChange={(e) => {
                const value = parseInt(e.target.value) || 6;
                if (value > 0 && value <= 120) {
                  onUnitMinutesChange(value);
                }
              }}
              className={styles.minutesInput}
            />
            <span>mins/unit</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ 
                width: `${(completedMaterials.size / getAllMaterials().length) * 100}%` 
              }} 
            />
          </div>
        </div>
      </div>

      <UnifiedTableView
        key={`studylist-${topicId}-${Date.now()}`}
        materials={data}
        viewType="studylist"
        onComplete={async (materialId, isCompleted) => {
          await onCompleteMaterial(materialId, isCompleted);
        }}
        onUpdateProgress={async (materialId, updates) => {
          return await onUpdateMaterial(materialId, updates);
        }}
        unitMinutes={unitMinutes}
        onReorderItems={onReorderMaterials ? handleReorderItems : undefined}
      />
      
      <VideoPopup 
        isOpen={contentPopup.isOpen}
        onClose={() => setContentPopup(prev => ({ ...prev, isOpen: false }))}
        url={contentPopup.url}
        title={contentPopup.title}
        unitMinutes={unitMinutes}
        showVideoContent={false}
      />
    </div>
  );
}
