import React, { useState, useEffect } from 'react';
import { Topic, Material } from '@/types/User';
import ContributionGraph from '../components/ContributionGraph';
import UnifiedTableView from '../components/UnifiedTableView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from '../components/ui/button';
import { Plus, Database, GitGraph, BarChart, Check, Clock, Play, Calendar, Tag } from 'lucide-react';
import CircleProgress from '../components/ui/circleProgress';
import LearningPathTab from '../components/LearningPathTab';
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

  // Categorize materials based on progress
  const todoMaterials = materials.filter(m => !m.progress || m.progress.completed === 0);
  const doingMaterials = materials.filter(m => m.progress && m.progress.completed > 0 && m.progress.completed < m.progress.total);
  const doneMaterials = materials.filter(m => m.progress && m.progress.completed === m.progress.total);

  // Handle status change
  const [isDragging, setIsDragging] = useState<string | null>(null);

  // Handle material status change
  const handleStatusChange = (material: Material, newStatus: 'todo' | 'doing' | 'done') => {
    if (!material._id) return;
    
    // Calculate new progress based on status
    switch (newStatus) {
      case 'todo':
        // Set progress to 0
        onUpdateProgress(material._id, 0, material.progress?.total || 10);
        if (material.completed) {
          onComplete(material._id, false);
        }
        break;
      case 'doing':
        // If previously not started or completed, set to halfway progress
        const total = material.progress?.total || 10;
        const halfProgress = Math.floor(total / 2);
        onUpdateProgress(material._id, halfProgress, total);
        if (material.completed) {
          onComplete(material._id, false);
        }
        break;
      case 'done':
        // Mark as completed
        onComplete(material._id, true);
        break;
    }
  };

  // Handle unit click to update progress
  const handleUnitClick = (material: Material, unitIndex: number) => {
    if (!material._id) return;

    const readingTime = material.readingTime || 10;
    const totalUnits = Math.ceil(readingTime / unitMinutes);
    
    // If clicked on already completed unit, do nothing
    const completedUnits = material.completedUnits || 0;
    if (unitIndex < completedUnits) return;
    
    // Calculate new completed units
    const newCompletedUnits = unitIndex + 1;
    
    // Update progress
    onUpdateProgress(
      material._id, 
      newCompletedUnits * unitMinutes, 
      readingTime
    );
    
    // If all units completed, mark as done
    if (newCompletedUnits === totalUnits) {
      onComplete(material._id, true);
    }
  };

  // Open content popup for viewing
  const handleOpenContent = (material: Material) => {
    if (!material.url) return;
    
    setContentPopup({
      isOpen: true,
      url: material.url,
      title: material.title || 'Untitled Content'
    });
  };

  // Get material type icon
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
        {/* Left Column - Topic Profile */}
        <div className="lg:col-span-1">
          <div className="flex items-start gap-4">
            {/* Topic Icon/Avatar */}
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">
              {topic.name.charAt(0).toUpperCase()}
            </div>
            
            {/* Topic Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{topic.name}</h1>
              <p className="text-gray-600 mt-1">
                Total contribution: {contributions?.totalMinutes || 0} mins
              </p>
              
              {/* Tags */}
              {topic.tags && topic.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {topic.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Topic Metadata */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center text-gray-700">
              <Clock className="h-5 w-5 mr-3 text-gray-500" />
              <span className="font-medium">Mins / Unit</span>
              <span className="ml-auto">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={unitMinutes}
                  onChange={(e) => onUnitMinutesChange(parseInt(e.target.value) || unitMinutes)}
                  className="w-16 p-1 border rounded text-center"
                />
              </span>
            </div>
            
            {topic.deadline && (
              <div className="flex items-center text-gray-700">
                <Calendar className="h-5 w-5 mr-3 text-gray-500" />
                <span className="font-medium">Deadline</span>
                <span className="ml-auto">
                  {new Date(topic.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Contribution Graph */}
        <div className="lg:col-span-2">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Contribution Graph</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-sm">No Collect</span>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-sm border border-gray-300"></div>
                    <div className="w-3 h-3 rounded-sm bg-blue-200"></div>
                    <div className="w-3 h-3 rounded-sm bg-blue-300"></div>
                    <div className="w-3 h-3 rounded-sm bg-blue-400"></div>
                    <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                  </div>
                  <span className="text-gray-500 text-sm">Great Collect</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-gray-100 rounded-lg">
              <div className="flex justify-between mb-2">
                <div className="text-gray-500 text-sm">2025</div>
                <div className="text-4xl font-bold">
                  {contributions?.totalMinutes || 120}
                </div>
              </div>
              <ContributionGraph data={contributions?.data || []} activeView="month" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white rounded-lg shadow">
        <Tabs defaultValue="progress" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="w-full border-b p-0">
            <TabsTrigger value="progress" className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
              <BarChart className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="database" className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
              <Database className="h-4 w-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="path" className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
              <GitGraph className="h-4 w-4 mr-2" />
              Learning Path
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents (keep existing tab contents but reorder them) */}
          <TabsContent value="progress" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* To Do section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center justify-between">
                  <span>To Do</span>
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
                            <span>0/{totalUnits} units</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleStatusChange(material, 'doing')}
                                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                              >
                                Start Learning
                              </button>
                              <button 
                                onClick={() => handleStatusChange(material, 'done')}
                                className="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                              >
                                Mark Complete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      <p>No items to do</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Doing section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center justify-between">
                  <span>In Progress</span>
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
                            <span>{completedUnits}/{totalUnits} units</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleStatusChange(material, 'todo')}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              >
                                Move to To Do
                              </button>
                              <button 
                                onClick={() => handleStatusChange(material, 'done')}
                                className="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                              >
                                Mark Complete
                              </button>
                            </div>
                          </div>
                          
                          {/* Clickable progress bar */}
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
                      <p>No items in progress</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Done section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center justify-between">
                  <span>Completed</span>
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
                            <span>{totalUnits}/{totalUnits} units</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleStatusChange(material, 'todo')}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              >
                                Move to To Do
                              </button>
                              <button 
                                onClick={() => handleStatusChange(material, 'doing')}
                                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                              >
                                Continue Learning
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      <p>No completed items</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Materials Tab Content */}
          <TabsContent value="database" className="p-4">
            {/* Database tab content */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Learning Resources ({materials.length})</h3>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Minutes/Unit:</span>
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

            {/* Materials table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Table headers */}
              <div className="grid grid-cols-12 bg-gray-50 text-gray-600 text-sm py-2 px-4 border-b">
                <div className="col-span-1">#</div>
                <div className="col-span-1">Progress</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-5">Name</div>
                <div className="col-span-2">Units</div>
                <div className="col-span-1">Completion</div>
                <div className="col-span-1">Actions</div>
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
                        <span className="text-gray-500 text-sm">units</span>
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
                            title="View Content"
                          >
                            <Play className="h-3 w-3" />
                          </button>
                        )}
                        <button 
                          onClick={() => onComplete(material._id || '', !material.completed)}
                          className={`p-1 rounded-full ${material.completed ? 'bg-green-500' : 'bg-gray-200'} text-white hover:opacity-90`}
                          title={material.completed ? "Mark as incomplete" : "Mark as completed"}
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

          {/* Learning Path Tab */}
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

      {/* Video Popup */}
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