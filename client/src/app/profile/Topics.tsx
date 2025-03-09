'use client';

import React, { useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, MoreHorizontal } from 'lucide-react';

export default function Topics() {
  const { userData, addTopic, updateTopicName, deleteTopic } = useUserData();
  const router = useRouter();
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editedTopicName, setEditedTopicName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle add topic
  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    
    setIsLoading(true);
    try {
      const newTopicId = await addTopic(newTopicName.trim());
      if (newTopicId) {
        setNewTopicName('');
        setIsAddingTopic(false);
      }
    } catch (error) {
      console.error('Failed to add topic:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle edit topic
  const startEditingTopic = (topicId: string, name: string) => {
    setEditingTopicId(topicId);
    setEditedTopicName(name);
  };
  
  const cancelEditing = () => {
    setEditingTopicId(null);
    setEditedTopicName('');
  };
  
  const saveTopicEdit = async (topicId: string) => {
    if (!editedTopicName.trim()) return;
    
    setIsLoading(true);
    try {
      await updateTopicName(topicId, editedTopicName.trim());
      setEditingTopicId(null);
    } catch (error) {
      console.error('Failed to update topic:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle delete topic
  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    
    try {
      await deleteTopic(topicId);
    } catch (error) {
      console.error('Failed to delete topic:', error);
    }
  };
  
  // Navigate to topic page
  const navigateToTopic = (topicId: string) => {
    router.push(`/database?topic=${topicId}`);
  };
  
  return (
    <div className="space-y-4">
      {/* Add topic button */}
      {!isAddingTopic ? (
        <button
          onClick={() => setIsAddingTopic(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Topic
        </button>
      ) : (
        <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-200">
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Topic name"
            autoFocus
          />
          <button
            onClick={handleAddTopic}
            disabled={isLoading || !newTopicName.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
          <button
            onClick={() => setIsAddingTopic(false)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}
      
      {/* Topics list */}
      <div className="space-y-3">
        {(!userData?.topics || userData.topics.length === 0) ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No topics yet. Create your first topic to get started!</p>
          </div>
        ) : (
          userData.topics.map((topic) => {
            const totalMaterials = topic.materials?.length || 0;
            const completedMaterials = topic.materials?.filter(m => m.completed)?.length || 0;
            const progress = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;
            
            return (
              <div 
                key={topic._id} 
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Edit mode */}
                {editingTopicId === topic._id ? (
                  <div className="p-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editedTopicName}
                        onChange={(e) => setEditedTopicName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => saveTopicEdit(topic._id || '')}
                        disabled={isLoading || !editedTopicName.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div onClick={() => navigateToTopic(topic._id || '')} className="cursor-pointer flex-1">
                        <h3 className="font-medium text-lg">{topic.name}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span>{totalMaterials} materials</span>
                          <span className="mx-2">•</span>
                          <span>{completedMaterials} completed</span>
                        </div>
                        <div className="mt-3 flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{progress}%</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => startEditingTopic(topic._id || '', topic.name || '')}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTopic(topic._id || '')}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 