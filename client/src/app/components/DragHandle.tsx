import React from 'react';
import styles from './DraggableList.module.css';
import { GripVertical } from 'lucide-react';

interface DragHandleProps {
  className?: string;
}

const DragHandle: React.FC<DragHandleProps> = ({ className }) => {
  return (
    <div className={`${styles.dragHandle} ${className || ''}`}>
      <GripVertical size={16} />
    </div>
  );
};

export default DragHandle; 