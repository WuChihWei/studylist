import { useState, useEffect } from 'react';
import { Material, Categories } from '../../types/User';
import styles from './StudyListView.module.css';
import { LuGlobe } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { FaCheck } from "react-icons/fa";

interface StudyListViewProps {
  categories: {
    webpage: Material[];
    video: Material[];
    podcast: Material[];
    book: Material[];
  };
  onCompleteMaterial: (materialId: string) => Promise<void>;
  unitMinutes?: number;
  topicId: string;
}

export default function StudyListView({ 
  categories, 
  onCompleteMaterial,
  unitMinutes = 20,
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
    let estimatedMinutes = 20;

    switch (material.type) {
      case 'webpage':
        estimatedMinutes = 15;
        break;
      case 'video':
        estimatedMinutes = 30;
        break;
      case 'podcast':
        estimatedMinutes = 45;
        break;
      case 'book':
        estimatedMinutes = 240;
        break;
    }

    return Math.ceil(estimatedMinutes / unitMinutes);
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

  const handleComplete = async (materialId: string) => {
    const newCompleted = new Set(completedMaterials);
    if (newCompleted.has(materialId)) {
      newCompleted.delete(materialId);
    } else {
      newCompleted.add(materialId);
    }
    setCompletedMaterials(newCompleted);
    await onCompleteMaterial(materialId);
  };

  return (
    <div className={styles.materialsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span>All ({getAllMaterials().length})</span>
          <span className={styles.unitMinutes}>{unitMinutes} mins/unit</span>
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
                  className={styles.completeButton}
                  onClick={() => handleComplete(material._id || '')}
                >
                  {completedMaterials.has(material._id || '') && <FaCheck size={12} />}
                </button>
                <span className={styles.materialNumber}>{index + 1}</span>
                <div className={styles.materialPreview}>
                  {typeIcons[material.type]}
                </div>
                <span className={styles.materialName}>{material.title}</span>
              </div>
              <div className={styles.materialRight}>
                <span className={styles.units}>
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
