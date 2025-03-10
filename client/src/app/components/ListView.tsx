import React from 'react';
import { Material } from '@/types/User';
import { ListSubMode } from '@/types/ViewMode';
import UnifiedTableView from './UnifiedTableView';
import { Button } from './ui/button';
import { BsListUl, BsGrid } from 'react-icons/bs';
import { Plus } from 'lucide-react';

interface ListViewProps {
  materials: Material[];
  categoryFilters: {
    web: boolean;
    video: boolean;
    podcast: boolean;
    book: boolean;
  };
  listSubMode: ListSubMode;
  setListSubMode: (mode: ListSubMode) => void;
  showAddNewMaterial: boolean;
  setShowAddNewMaterial: (show: boolean) => void;
  topicId: string;
  refreshKey: number;
  unitMinutes: number;
  setUnitMinutes: (minutes: number) => void;
  onUpdateProgress: (id: string, completed: number, total: number) => Promise<boolean>;
  onComplete: (id: string, isCompleted: boolean) => Promise<void>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onReorderItems: (items: Material[]) => Promise<void>;
}

const ListView: React.FC<ListViewProps> = ({
  materials,
  categoryFilters,
  listSubMode,
  setListSubMode,
  showAddNewMaterial,
  setShowAddNewMaterial,
  topicId,
  refreshKey,
  unitMinutes,
  setUnitMinutes,
  onUpdateProgress,
  onComplete,
  onEdit,
  onDelete,
  onReorderItems
}) => {
  // 对材料进行过滤
  const filteredMaterials = materials.filter(material => {
    if (material.type === 'webpage' && categoryFilters.web) return true;
    if (material.type === 'video' && categoryFilters.video) return true;
    if (material.type === 'podcast' && categoryFilters.podcast) return true;
    if (material.type === 'book' && categoryFilters.book) return true;
    return false;
  });

  return (
    <div className="space-y-6">
      {/* 列表视图标题和筛选器 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setListSubMode('list')}
            className={listSubMode === 'list' ? 'bg-accent' : ''}
          >
            <BsListUl className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setListSubMode('grid')}
            className={listSubMode === 'grid' ? 'bg-accent' : ''}
          >
            <BsGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 资料列表 */}
      <div className={listSubMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}>
        {filteredMaterials.length === 0 ? (
          <div className="text-center p-8 text-gray-500 bg-white rounded-lg shadow">
            <div className="flex flex-col items-center justify-center py-16">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-4">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">没有材料</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                在这个主题下没有找到任何学习材料。点击上方的"Add New Material..."按钮添加您的第一个材料。
              </p>
              <Button 
                onClick={() => setShowAddNewMaterial(true)}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加学习材料
              </Button>
            </div>
          </div>
        ) : (
          <div className={`w-full ${listSubMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}`}>
            <UnifiedTableView
              key={`${topicId}-${refreshKey}`}
              materials={filteredMaterials.map((material, index) => ({
                ...material,
                index: index + 1
              }))}
              viewType="materials"
              viewMode={listSubMode}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
              onUpdateProgress={onUpdateProgress}
              onReorderItems={onReorderItems}
              unitMinutes={unitMinutes}
              onUnitMinutesChange={setUnitMinutes}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView; 