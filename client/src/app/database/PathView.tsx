import React from 'react';
import { Material } from '@/types/User';
import PathLayout from './PathLayout';

interface PathViewProps {
  topic: any;
  materials: Material[];
  contributions: any;
  unitMinutes: number;
  setUnitMinutes: (minutes: number) => void;
  onUpdateProgress: (id: string, completed: number, total: number) => Promise<boolean>;
  onComplete: (id: string, isCompleted: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<boolean>;
  onReorderItems: (items: Material[]) => Promise<void>;
  isAllTopics?: boolean;
}

const PathView: React.FC<PathViewProps> = ({
  topic,
  materials,
  contributions,
  unitMinutes,
  setUnitMinutes,
  onUpdateProgress,
  onComplete,
  onDelete,
  onReorderItems,
  isAllTopics
}) => {
  return (
    <PathLayout
      topic={topic}
      materials={materials}
      contributions={contributions}
      onUpdateProgress={onUpdateProgress}
      onComplete={onComplete}
      onEdit={() => {}}
      onDelete={onDelete}
      onReorderItems={onReorderItems}
      unitMinutes={unitMinutes}
      onUnitMinutesChange={setUnitMinutes}
      isAllTopics={isAllTopics}
    />
  );
};

export default PathView; 