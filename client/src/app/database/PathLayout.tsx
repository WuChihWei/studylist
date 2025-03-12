import React, { useState, useEffect } from 'react';
import { Topic, Material } from '@/types/User';
import ContributionGraph from '@/app/components/ContributionGraph';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from '@/app/components/ui/button';
import { Plus, Database, GitGraph, BarChart, Calendar as CalendarIcon, Tag, X } from 'lucide-react';
import LearningPathTab from '../components/LearningPathTab';
import { FiBook, FiVideo, FiGlobe } from 'react-icons/fi';
import { HiOutlineMicrophone } from 'react-icons/hi';
import { renderFavicon, TYPE_ICONS, FAVICON_STYLES } from '@/utils/favicon';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { DatePicker } from '@/app/components/DatePicker';
import ProgressTab from '@/app/components/ProgressTab';
import MaterialsTab from '@/app/components/MaterialsTab';

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
  isAllTopics?: boolean;
}

// A simple video popup component
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
        <div className="flex justify-between items-center  border-b">
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
  onComplete,
  isAllTopics
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

  // 添加 deadline 和 tags 编辑状态
  const [date, setDate] = useState<Date | undefined>(
    topic.deadline ? new Date(topic.deadline) : undefined
  );
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [currentTags, setCurrentTags] = useState<string[]>(topic.tags || []);
  
  // Update state in response to topic changes
  useEffect(() => {
    setDate(topic.deadline ? new Date(topic.deadline) : undefined);
    setCurrentTags(topic.tags || []);
  }, [topic]);
  
  // Handle date change
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    // Update topic API should be called here
    // Example: updateTopic(topic._id, { deadline: newDate })
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const updatedTags = [...currentTags, newTag.trim()];
    setCurrentTags(updatedTags);
    setNewTag('');
    
    // Update topic API should be called here
    // Example: updateTopic(topic._id, { tags: updatedTags })
  };
  
  // Handle removing a tag
  const handleRemoveTag = (indexToRemove: number) => {
    const updatedTags = currentTags.filter((_, index) => index !== indexToRemove);
    setCurrentTags(updatedTags);
    
    // Update topic API should be called here
    // Example: updateTopic(topic._id, { tags: updatedTags })
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

  return (
    <div className="flex flex-col gap-4 hide-scrollbar">
      {/* Add favicon styles */}
      <style dangerouslySetInnerHTML={{ __html: FAVICON_STYLES.fallbackIcon }} />
      <style dangerouslySetInnerHTML={{ __html: FAVICON_STYLES.showFallback }} />
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      ` }} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
        {/* Left Column - Topic Profile */}
        <div className="bg-white border-b">
          {/* Topic Info - Simplified header */}
          <h1 className="py-2 border-b border-t border-gray-200">{topic.name}</h1>
          {/* Topic Metadata - Simple list style */}
          <div className="flex flex-col gap-2">
            {/* Mins / Unit */}
            <div className="flex items-center justify-between pt-2  border-gray-200">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-3 text-gray-500" />
                <h6 className="">Mins / Unit</h6>
              </div>
              <h6 className="font-medium text-gray-600 border-b border-gray-300">
                {unitMinutes}
              </h6>
            </div>

            {/* Deadline */}
            <div className="flex items-center justify-between border-gray-200">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-3 text-gray-500" />
                <h6 className="">Deadline</h6>
              </div>
              <h6 className="font-medium text-gray-600 border-b border-gray-300">
                {date ? format(date, 'MMM dd, yyyy') : 'No deadline'}
              </h6>
            </div>
            
            {/* Tags */}
            <div className="flex items-center justify-between  border-gray-200">
              <div className="flex items-center">
                <Tag className="h-5 w-5 mr-3 text-gray-500" />
                <h6 className="">Tags</h6>
              </div>
              <div className="flex items-center gap-2">
                {currentTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <h6 className="font-medium text-gray-600 border-b border-gray-300">No tags</h6>
                )}
                <button
                  onClick={() => setShowTagDialog(true)}
                  className=" text-blue-500 hover:text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Contribution Graph */}
        <div className="bg-white ">
          <div className="w-full overflow-x-auto hide-scrollbar">
              {contributions && (
                <ContributionGraph 
                  data={contributions.map(c => ({
                    date: c.date,
                    count: c.count || 0,
                    studyCount: 0
                  })) || []} 
                  activeView="month"
                />
              )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white">
        <Tabs defaultValue="progress" onValueChange={setActiveTab} value={activeTab} className="mt-2">
          <div className="border-b border-gray-200 mb-6">
            <TabsList className="flex justify-start w-full h-auto bg-transparent p-0">
              <TabsTrigger 
                value="progress" 
                className="flex items-center px-3 py-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black text-gray-500 hover:text-gray-800 bg-transparent"
              >
                <BarChart className="h-4 w-4 mr-2" />
                Progress
              </TabsTrigger>
             
              <TabsTrigger 
                value="path" 
                className="flex items-center px-3 py-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black text-gray-500 hover:text-gray-800 bg-transparent"
              >
                <GitGraph className="h-4 w-4 mr-2" />
                Learning Path
              </TabsTrigger>
              
              <TabsTrigger 
                value="database" 
                className="flex items-center px-3 py-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black text-gray-500 hover:text-gray-800 bg-transparent"
              >
                <Database className="h-4 w-4 mr-2" />
                Materials
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Progress Tab Content */}
          <TabsContent value="progress" className="">
            <ProgressTab 
              materials={materials} 
              unitMinutes={unitMinutes}
              onUpdateProgress={onUpdateProgress}
              onComplete={onComplete}
              handleOpenContent={handleOpenContent}
            />
          </TabsContent>

          {/* Materials Tab Content */}
          <TabsContent value="database" className="">
            <MaterialsTab 
              materials={materials}
              unitMinutes={unitMinutes}
              onUpdateProgress={onUpdateProgress}
              onComplete={onComplete}
              handleOpenContent={handleOpenContent}
            />
          </TabsContent>

          {/* Learning Path Tab */}
          <TabsContent value="path" className="">
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

      {/* Tags Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="tag" className="sr-only">
                  New Tag
                </Label>
                <Input
                  id="tag"
                  placeholder="Add new tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTag.trim()) {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={handleAddTag}
                type="submit"
                size="sm"
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </div>
            
            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">Current Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {currentTags.length > 0 ? (
                  currentTags.map((tag, index) => (
                    <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1.5">
                      <span className="text-sm">{tag}</span>
                      <button 
                        onClick={() => handleRemoveTag(index)}
                        className="ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm py-2">No tags added yet</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button 
              variant="outline"
              onClick={() => setShowTagDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PathLayout; 