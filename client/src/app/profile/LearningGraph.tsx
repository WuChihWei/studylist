'use client';

import React, { useMemo } from 'react';
import { useUserData } from '@/hooks/useUserData';

interface LearningGraphProps {
  limit?: number;
}

export default function LearningGraph({ limit }: LearningGraphProps) {
  const { userData } = useUserData();
  
  // Process topics data for visualization
  const topicsData = useMemo(() => {
    if (!userData?.topics) return [];
    
    const data = userData.topics.map(topic => {
      const totalMaterials = topic.materials?.length || 0;
      const completedMaterials = topic.materials?.filter(m => m.completed)?.length || 0;
      const progress = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;
      
      return {
        id: topic._id,
        name: topic.name,
        totalMaterials,
        completedMaterials,
        progress
      };
    });
    
    // Sort by progress (descending)
    return data.sort((a, b) => b.progress - a.progress);
  }, [userData?.topics]);
  
  // Limit the number of topics if specified
  const displayData = limit ? topicsData.slice(0, limit) : topicsData;
  
  // Calculate overall learning progress
  const overallProgress = useMemo(() => {
    if (topicsData.length === 0) return 0;
    
    const totalMaterials = topicsData.reduce((sum, topic) => sum + topic.totalMaterials, 0);
    const completedMaterials = topicsData.reduce((sum, topic) => sum + topic.completedMaterials, 0);
    
    return totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;
  }, [topicsData]);
  
  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Overall Learning Progress</h3>
          <span className="text-sm font-semibold text-blue-600">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Topics progress */}
      <div className="space-y-4">
        <h3 className="font-medium">Topics Progress</h3>
        
        {displayData.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No topics available</p>
        ) : (
          <div className="space-y-4">
            {displayData.map(topic => (
              <div key={topic.id} className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium truncate">{topic.name}</div>
                  <span className="text-sm font-semibold text-blue-600">{topic.progress}%</span>
                </div>
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <span>{topic.completedMaterials} of {topic.totalMaterials} materials completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${topic.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Learning statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase">Topics</div>
          <div className="mt-1 text-2xl font-semibold">{topicsData.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase">Materials</div>
          <div className="mt-1 text-2xl font-semibold">
            {topicsData.reduce((sum, topic) => sum + topic.totalMaterials, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase">Completed</div>
          <div className="mt-1 text-2xl font-semibold">
            {topicsData.reduce((sum, topic) => sum + topic.completedMaterials, 0)}
          </div>
        </div>
      </div>
    </div>
  );
} 