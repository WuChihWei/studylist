import { useState, useEffect } from 'react';
import { Material, Categories } from '../../types/User';
import styles from './StudyListView.module.css';
import { LuGlobe } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { FaCheck, FaTimes } from "react-icons/fa";

interface StudyListViewProps {
  categories: Categories;
  onCompleteMaterial: (materialId: string, isCompleted: boolean) => Promise<void>;
  unitMinutes: number;
  onUnitMinutesChange: (minutes: number) => void;
  topicId: string;
}

export default function StudyListView({ 
  categories, 
  onCompleteMaterial,
  unitMinutes,
  onUnitMinutesChange,
  topicId
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
    if (!material.readingTime) {
      return '?';
    }
    return Math.ceil(material.readingTime / unitMinutes);
  };

  const getAllMaterials = () => {
    const allMaterials = [
      ...categories.webpage.map(m => ({ ...m, type: 'webpage' as const })),
      ...categories.video.map(m => ({ ...m, type: 'video' as const })),
      ...categories.podcast.map(m => ({ ...m, type: 'podcast' as const })),
      ...categories.book.map(m => ({ ...m, type: 'book' as const }))
    ];

    return allMaterials.sort((a, b) => {
      const aCompleted = completedMaterials.has(a._id || '');
      const bCompleted = completedMaterials.has(b._id || '');
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1;
    });
  };

  const handleComplete = async (material: Material) => {
    if (!material._id) return;
    
    const isCompleted = material.completed || false;
    console.log('7. Completing material:', {
      materialId: material._id,
      currentStatus: isCompleted,
      material: material
    });
    
    try {
      await onCompleteMaterial(material._id, isCompleted);
      console.log('Successfully called onCompleteMaterial');
      
      const newCompleted = new Set(completedMaterials);
      if (isCompleted) {
        newCompleted.delete(material._id);
      } else {
        newCompleted.add(material._id);
      }
      setCompletedMaterials(newCompleted);
      console.log('Updated local state:', {
        newCompletedSize: newCompleted.size,
        isCompleted
      });
    } catch (error) {
      console.error('Error in handleComplete:', error);
    }
  };

  return (
    <div className={styles.materialsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span>All ({getAllMaterials().length})</span>
          <div className={styles.unitMinutesInput}>
            <input
              type="number"
              min="1"
              max="120"
              value={unitMinutes}
              onChange={(e) => {
                const value = parseInt(e.target.value);
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

      <div className={styles.materialsList}>
        <div className={styles.materialsListContent}>
          {getAllMaterials().map((material, index) => (
            <div 
              key={material._id || index} 
              className={`${styles.materialItem} ${
                completedMaterials.has(material._id || '') ? styles.completed : ''
              }`}
            >
              <div className={styles.materialLeft}>
                <button
                  onClick={() => handleComplete(material)}
                  className={`${styles.completeButton} ${material.completed ? styles.completed : ''}`}
                >
                  {material.completed && <FaCheck />}
                </button>
                <span className={styles.materialNumber}>{index + 1}</span>
                <div className={styles.materialPreview}>
                  {typeIcons[material.type]}
                </div>
                <span className={styles.materialName}>{material.title}</span>
              </div>
              <div className={styles.materialRight}>
                <span className={`${styles.units} ${estimateTimeUnits(material) === '?' ? styles.unknown : ''}`}>
                  {estimateTimeUnits(material)} units
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
