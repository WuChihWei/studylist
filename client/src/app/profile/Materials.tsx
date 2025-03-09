'use client';

import React, { useState, useMemo } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useRouter } from 'next/navigation';
import { Filter, Globe, BookOpen, Video, Headphones, CheckCircle, Search } from 'lucide-react';

// Material type icons mapping
const TYPE_ICONS = {
  webpage: Globe,
  book: BookOpen,
  video: Video,
  podcast: Headphones,
};

type MaterialType = 'all' | 'webpage' | 'video' | 'podcast' | 'book';

export default function Materials() {
  const { userData, completeMaterial, uncompleteMaterial, deleteMaterial } = useUserData();
  const router = useRouter();
  const [activeType, setActiveType] = useState<MaterialType>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Process and filter materials
  const allMaterials = useMemo(() => {
    if (!userData?.topics) return [];
    
    // Extract all materials from all topics
    const materials = userData.topics.flatMap((topic) => {
      const topicMaterials = topic.materials || [];
      return topicMaterials.map((material) => ({
        ...material,
        topicId: topic._id,
        topicName: topic.name,
      }));
    });
    
    return materials;
  }, [userData?.topics]);
  
  // Apply filters
  const filteredMaterials = useMemo(() => {
    let result = [...allMaterials];
    
    // Filter by type
    if (activeType !== 'all') {
      result = result.filter((material) => material.type === activeType);
    }
    
    // Filter by completion status
    if (!showCompleted) {
      result = result.filter((material) => !material.completed);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((material) => 
        material.title?.toLowerCase().includes(query) || 
        material.url?.toLowerCase().includes(query) ||
        material.topicName?.toLowerCase().includes(query)
      );
    }
    
    // Sort by completion status and topic
    result.sort((a, b) => {
      // Sort by completion (incomplete first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Then by topic name
      return (a.topicName || '').localeCompare(b.topicName || '');
    });
    
    return result;
  }, [allMaterials, activeType, showCompleted, searchQuery]);
  
  // Handle toggle completion
  const toggleCompletion = async (materialId: string, isCompleted: boolean) => {
    if (isCompleted) {
      await uncompleteMaterial(materialId);
    } else {
      await completeMaterial(materialId);
    }
  };
  
  // Handle delete material
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      await deleteMaterial(materialId);
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };
  
  // Navigate to material details
  const navigateToMaterial = (topicId: string, materialId: string) => {
    router.push(`/database?topic=${topicId}&material=${materialId}`);
  };
  
  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Search materials..."
          />
        </div>
        
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-completed"
              checked={showCompleted}
              onChange={() => setShowCompleted(!showCompleted)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="show-completed" className="text-sm text-gray-700">
              Show Completed
            </label>
          </div>
          
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value as MaterialType)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Types</option>
            <option value="webpage">Web</option>
            <option value="video">Video</option>
            <option value="podcast">Podcast</option>
            <option value="book">Book</option>
          </select>
        </div>
      </div>
      
      {/* Materials list */}
      <div className="space-y-3">
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No materials found matching your criteria</p>
            <button
              onClick={() => {
                setActiveType('all');
                setShowCompleted(true);
                setSearchQuery('');
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredMaterials.map((material) => {
            const TypeIcon = TYPE_ICONS[material.type as keyof typeof TYPE_ICONS] || Globe;
            
            return (
              <div 
                key={material._id} 
                className={`bg-white rounded-lg border overflow-hidden ${
                  material.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between">
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => navigateToMaterial(material.topicId || '', material._id || '')}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${
                          material.completed ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <TypeIcon className={`h-4 w-4 ${
                            material.completed ? 'text-green-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className={`font-medium ${
                            material.completed ? 'text-green-800' : 'text-gray-900'
                          }`}>
                            {material.title}
                          </h3>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                              {material.topicName}
                            </span>
                            {material.url && (
                              <span className="ml-2 truncate max-w-xs">
                                {material.url.replace(/^https?:\/\/(www\.)?/, '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <button 
                        onClick={() => toggleCompletion(material._id || '', !!material.completed)}
                        className={`p-1 rounded hover:bg-gray-100 ${
                          material.completed ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMaterial(material._id || '')}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 