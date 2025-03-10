import React, { useState, useEffect } from 'react';
import { Topic, Material } from '@/types/User';
import ContributionGraph from './ContributionGraph';
import UnifiedTableView from './UnifiedTableView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from './ui/button';
import { Plus, Database, GitGraph, BarChart, Check, Clock, Play } from 'lucide-react';
import CircleProgress from './ui/circleProgress';
import LearningPathTab from './LearningPathTab';
import { FiBook, FiVideo, FiGlobe } from 'react-icons/fi';
import { HiOutlineMicrophone } from 'react-icons/hi';

interface PathLayoutProps {
  topic: Topic;
  materials: Material[];
  contributions: any;
  unitMinutes: number;
  onUnitMinutesChange: (value: number) => void;
  onReorderItems: (items: Material[]) => Promise<void>;
  onUpdateProgress: (id: string, completed: number, total: number) => Promise<boolean>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onComplete: (id: string, isCompleted: boolean) => Promise<void>;
}

// 添加一个简单的视频弹窗组件
const VideoPopup = ({ isOpen, onClose, url, title }: { 
  isOpen: boolean; 
  onClose: () => void; 
  url: string; 
  title: string;
  unitMinutes?: number;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <div className="aspect-video w-full">
            <iframe 
              src={url} 
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

const PathLayout: React.FC<PathLayoutProps> = ({
  topic,
  materials,
  contributions,
  unitMinutes,
  onUnitMinutesChange,
  onReorderItems,
  onUpdateProgress,
  onEdit,
  onDelete,
  onComplete
}) => {
  const [activeTab, setActiveTab] = useState("database");
  const [contentPopup, setContentPopup] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    title: ''
  });

  // 基于进度分类材料
  const todoMaterials = materials.filter(m => !m.progress || m.progress.completed === 0);
  const doingMaterials = materials.filter(m => m.progress && m.progress.completed > 0 && m.progress.completed < m.progress.total);
  const doneMaterials = materials.filter(m => m.progress && m.progress.completed === m.progress.total);

  // 添加额外的状态和函数来处理状态间移动
  const [isDragging, setIsDragging] = useState<string | null>(null);

  // 处理材料状态变更
  const handleStatusChange = (material: Material, newStatus: 'todo' | 'doing' | 'done') => {
    if (!material._id) return;
    
    // 根据新状态计算完成进度
    switch (newStatus) {
      case 'todo':
        // 设置为0进度
        onUpdateProgress(material._id, 0, material.progress?.total || 10);
        if (material.completed) {
          onComplete(material._id, false);
        }
        break;
      case 'doing':
        // 如果之前是未开始，设置为一半进度；如果是已完成，设置为一半进度
        const total = material.progress?.total || 10;
        const halfProgress = Math.floor(total / 2);
        onUpdateProgress(material._id, halfProgress, total);
        if (material.completed) {
          onComplete(material._id, false);
        }
        break;
      case 'done':
        // 设置为已完成
        onComplete(material._id, true);
        break;
    }
  };

  // 处理单元格点击事件
  const handleUnitClick = (material: Material, unitIndex: number) => {
    if (!material._id) return;

    const readingTime = material.readingTime || 10;
    const totalUnits = Math.ceil(readingTime / unitMinutes);
    
    // 如果点击已完成的单元格，不做任何操作
    const completedUnits = material.completedUnits || 0;
    if (unitIndex < completedUnits) return;
    
    // 计算新的完成单元数
    const newCompletedUnits = unitIndex + 1;
    
    // 更新进度
    onUpdateProgress(
      material._id, 
      newCompletedUnits * unitMinutes, 
      readingTime
    );
    
    // 如果全部完成，标记为已完成
    if (newCompletedUnits === totalUnits) {
      onComplete(material._id, true);
    }
  };

  // 打开内容弹窗
  const handleOpenContent = (material: Material) => {
    if (!material.url) return;
    
    setContentPopup({
      isOpen: true,
      url: material.url,
      title: material.title || 'Untitled Content'
    });
  };

  // 获取材料类型图标
  const getMaterialTypeIcon = (type: string) => {
    switch(type) {
      case 'video':
        return <FiVideo className="h-4 w-4" />;
      case 'webpage':
        return <FiGlobe className="h-4 w-4" />;
      case 'podcast':
        return <HiOutlineMicrophone className="h-4 w-4" />;
      case 'book':
        return <FiBook className="h-4 w-4" />;
      default:
        return <FiGlobe className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Topic信息 */}
      

      {/* 三个选项卡 */}
      <div className="bg-white rounded-lg shadow">
        <Tabs defaultValue="database" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="w-full border-b p-0">
            <TabsTrigger value="database" className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
              <Database className="h-4 w-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
              <BarChart className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="path" className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
              <GitGraph className="h-4 w-4 mr-2" />
              Path
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">学习资源 ({materials.length})</h3>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">每单元分钟：</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={unitMinutes}
                  onChange={(e) => onUnitMinutesChange(parseInt(e.target.value) || unitMinutes)}
                  className="w-16 p-1 border rounded text-center"
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-50 text-gray-600 text-sm py-2 px-4 border-b">
                <div className="col-span-1">#</div>
                <div className="col-span-1">进度</div>
                <div className="col-span-1">类型</div>
                <div className="col-span-5">名称</div>
                <div className="col-span-2">单元</div>
                <div className="col-span-1">完成度</div>
                <div className="col-span-1">操作</div>
              </div>

              <div className="divide-y">
                {materials.map((material, index) => {
                  // 计算进度相关数据
                  const readingTime = material.readingTime || 10;
                  const totalUnits = Math.ceil(readingTime / unitMinutes);
                  const completedUnits = Math.min(
                    Math.ceil((material.progress?.completed || 0) / unitMinutes),
                    totalUnits
                  );
                  const progress = totalUnits > 0 ? completedUnits / totalUnits : 0;
                  const progressPercent = Math.round(progress * 100);

                  return (
                    <div key={material._id || index} className="grid grid-cols-12 py-3 px-4 items-center hover:bg-gray-50">
                      {/* 序号 */}
                      <div className="col-span-1 font-medium text-gray-700">{index + 1}</div>
                      
                      {/* 进度圆圈 */}
                      <div className="col-span-1 flex items-center gap-1">
                        <CircleProgress 
                          progress={progress} 
                          size={28} 
                          color={progress === 1 ? '#10B981' : '#4169E1'}
                        />
                      </div>
                      
                      {/* 类型图标 */}
                      <div className="col-span-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600">
                          {getMaterialTypeIcon(material.type)}
                        </div>
                      </div>
                      
                      {/* 名称 */}
                      <div className="col-span-5">
                        <div className="font-medium text-gray-800 hover:text-blue-600 truncate cursor-pointer" 
                             onClick={() => material.url && handleOpenContent(material)}>
                          {material.title}
                          {material.url && (
                            <span className="inline-block ml-1 text-blue-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </span>
                          )}
                        </div>
                        
                        {/* 单元格进度条 */}
                        <div className="flex mt-2 gap-1">
                          {Array.from({ length: totalUnits }).map((_, i) => (
                            <div 
                              key={i}
                              onClick={() => handleUnitClick(material, i)}
                              className={`w-6 h-3 rounded cursor-pointer transition-colors ${
                                i < completedUnits 
                                  ? 'bg-blue-500 hover:bg-blue-600' 
                                  : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* 单元数编辑 */}
                      <div className="col-span-2 flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={totalUnits}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            if (value > 0 && value <= 100) {
                              onUpdateProgress(
                                material._id || '', 
                                material.progress?.completed || 0, 
                                value * unitMinutes
                              );
                            }
                          }}
                          className="w-16 p-1 border rounded text-center"
                        />
                        <span className="text-gray-500 text-sm">单元</span>
                      </div>
                      
                      {/* 完成度百分比 */}
                      <div className="col-span-1 text-sm font-medium text-blue-600">
                        {progressPercent}%
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="col-span-1 flex gap-2">
                        {material.url && (
                          <button 
                            onClick={() => handleOpenContent(material)}
                            className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                            title="查看内容"
                          >
                            <Play className="h-3 w-3" />
                          </button>
                        )}
                        <button 
                          onClick={() => onComplete(material._id || '', !material.completed)}
                          className={`p-1 rounded-full ${material.completed ? 'bg-green-500' : 'bg-gray-200'} text-white hover:opacity-90`}
                          title={material.completed ? "标记为未完成" : "标记为已完成"}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* To Do 部分 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center justify-between">
                  <span>待学习</span>
                  <span className="text-sm bg-gray-200 px-2 py-1 rounded-full">{todoMaterials.length}</span>
                </h3>
                
                <div 
                  className="space-y-3 min-h-[200px]"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('bg-blue-50');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('bg-blue-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('bg-blue-50');
                    if (isDragging) {
                      const material = materials.find(m => m._id === isDragging);
                      if (material) {
                        handleStatusChange(material, 'todo');
                      }
                      setIsDragging(null);
                    }
                  }}
                >
                  {todoMaterials.length > 0 ? (
                    todoMaterials.map((material, index) => {
                      const totalUnits = Math.ceil((material.readingTime || 10) / unitMinutes);
                      const progress = 0;
                      
                      return (
                        <div 
                          key={material._id || index} 
                          className="bg-white p-4 rounded-lg shadow-sm group transition-all hover:shadow-md"
                          draggable
                          onDragStart={() => setIsDragging(material._id || null)}
                          onDragEnd={() => setIsDragging(null)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-full bg-gray-100">
                                {getMaterialTypeIcon(material.type)}
                              </div>
                              <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">
                                {material.title}
                              </h4>
                            </div>
                            <span className="text-sm text-gray-500">0%</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div className="bg-blue-600 h-2 rounded-full w-0"></div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>0/{totalUnits} 单元</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleStatusChange(material, 'doing')}
                                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                              >
                                开始学习
                              </button>
                              <button 
                                onClick={() => handleStatusChange(material, 'done')}
                                className="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                              >
                                标记完成
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      <p>暂无待学习项目</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Doing 部分 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center justify-between">
                  <span>进行中</span>
                  <span className="text-sm bg-gray-200 px-2 py-1 rounded-full">{doingMaterials.length}</span>
                </h3>
                
                <div 
                  className="space-y-3 min-h-[200px]"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('bg-blue-50');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('bg-blue-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('bg-blue-50');
                    if (isDragging) {
                      const material = materials.find(m => m._id === isDragging);
                      if (material) {
                        handleStatusChange(material, 'doing');
                      }
                      setIsDragging(null);
                    }
                  }}
                >
                  {doingMaterials.length > 0 ? (
                    doingMaterials.map((material, index) => {
                      const totalUnits = Math.ceil((material.readingTime || 10) / unitMinutes);
                      const completedUnits = material.completedUnits || 
                        Math.floor((material.progress?.completed || 0) / unitMinutes);
                      const progress = totalUnits > 0 ? completedUnits / totalUnits : 0;
                      const progressPercent = Math.round(progress * 100);
                      
                      return (
                        <div 
                          key={material._id || index} 
                          className="bg-white p-4 rounded-lg shadow-sm group transition-all hover:shadow-md"
                          draggable
                          onDragStart={() => setIsDragging(material._id || null)}
                          onDragEnd={() => setIsDragging(null)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-full bg-gray-100">
                                {getMaterialTypeIcon(material.type)}
                              </div>
                              <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">
                                {material.title}
                              </h4>
                            </div>
                            <span className="text-sm text-blue-600">{progressPercent}%</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>{completedUnits}/{totalUnits} 单元</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleStatusChange(material, 'todo')}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              >
                                移至待学习
                              </button>
                              <button 
                                onClick={() => handleStatusChange(material, 'done')}
                                className="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                              >
                                标记完成
                              </button>
                            </div>
                          </div>
                          
                          {/* 点击进度条更新进度 */}
                          <div className="flex mt-2 gap-1">
                            {Array.from({ length: totalUnits }).map((_, i) => (
                              <div 
                                key={i}
                                onClick={() => handleUnitClick(material, i)}
                                className={`w-full h-2 rounded cursor-pointer transition-colors ${
                                  i < completedUnits 
                                    ? 'bg-blue-500 hover:bg-blue-600' 
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      <p>暂无进行中项目</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Done 部分 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center justify-between">
                  <span>已完成</span>
                  <span className="text-sm bg-gray-200 px-2 py-1 rounded-full">{doneMaterials.length}</span>
                </h3>
                
                <div 
                  className="space-y-3 min-h-[200px]"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('bg-green-50');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('bg-green-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('bg-green-50');
                    if (isDragging) {
                      const material = materials.find(m => m._id === isDragging);
                      if (material) {
                        handleStatusChange(material, 'done');
                      }
                      setIsDragging(null);
                    }
                  }}
                >
                  {doneMaterials.length > 0 ? (
                    doneMaterials.map((material, index) => {
                      const totalUnits = Math.ceil((material.readingTime || 10) / unitMinutes);
                      
                      return (
                        <div 
                          key={material._id || index} 
                          className="bg-white p-4 rounded-lg shadow-sm group transition-all hover:shadow-md"
                          draggable
                          onDragStart={() => setIsDragging(material._id || null)}
                          onDragEnd={() => setIsDragging(null)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-full bg-gray-100">
                                {getMaterialTypeIcon(material.type)}
                              </div>
                              <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">
                                {material.title}
                              </h4>
                            </div>
                            <span className="text-sm text-green-600">100%</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div className="bg-green-600 h-2 rounded-full w-full"></div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>{totalUnits}/{totalUnits} 单元</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleStatusChange(material, 'todo')}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              >
                                移至待学习
                              </button>
                              <button 
                                onClick={() => handleStatusChange(material, 'doing')}
                                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                              >
                                继续学习
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      <p>暂无已完成项目</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="path" className="p-4">
            <LearningPathTab 
              materials={materials.map((material, index) => ({
                ...material,
                index: index + 1
              }))}
              topicId={topic._id || ''}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* 视频弹窗 */}
      <VideoPopup 
        isOpen={contentPopup.isOpen}
        onClose={() => setContentPopup(prev => ({ ...prev, isOpen: false }))}
        url={contentPopup.url}
        title={contentPopup.title}
        unitMinutes={unitMinutes}
      />
    </div>
  );
};

export default PathLayout; 