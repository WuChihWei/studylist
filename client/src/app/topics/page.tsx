'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { useViewMode } from '@/hooks/useViewMode';
import { Topic } from '@/types/User';
import TopicList from '@/app/components/TopicList/TopicList';
import LearningPathFlow from '@/app/components/PathComponents/LearningPathFlow';
import PathToggle from '@/app/components/ui/PathToggle';
import { Button } from '@/app/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

export default function TopicsPage() {
  const { userData, addTopic, updateTopicName, deleteTopic } = useUserData();
  const { viewMode, setViewMode } = useViewMode('list');
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams ? searchParams.get('topic') : null;
  
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Effect to update selected topic when URL changes
  useEffect(() => {
    if (userData && userData.topics && topicId) {
      const topic = userData.topics.find(t => t._id === topicId);
      if (topic) {
        setSelectedTopic(topic);
        
        // Extract materials
        if (topic.materials) {
          setMaterials(topic.materials.map((material, index) => ({
            ...material,
            index: index + 1
          })));
        } else if (topic.categories) {
          // Legacy data structure
          const allMaterials = [
            ...(topic.categories.webpage || []),
            ...(topic.categories.video || []),
            ...(topic.categories.podcast || []),
            ...(topic.categories.book || [])
          ].map((material, index) => ({
            ...material,
            index: index + 1
          }));
          
          setMaterials(allMaterials);
        }
      }
    } else {
      setSelectedTopic(null);
      setMaterials([]);
    }
  }, [userData, topicId]);

  // Handle topic selection
  const handleSelectTopic = (id: string) => {
    router.push(`/topics?topic=${id}`);
  };

  // Handle add topic
  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    
    setIsLoading(true);
    try {
      const newTopicId = await addTopic(newTopicName.trim());
      if (newTopicId) {
        setShowAddDialog(false);
        setNewTopicName('');
        router.push(`/topics?topic=${newTopicId}`);
      }
    } catch (error) {
      console.error('Failed to add topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit topic
  const handleEditTopic = async () => {
    if (!selectedTopic || !newTopicName.trim()) return;
    
    setIsLoading(true);
    try {
      await updateTopicName(selectedTopic._id || '', newTopicName.trim());
      setShowEditDialog(false);
      setNewTopicName('');
    } catch (error) {
      console.error('Failed to update topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete topic
  const handleDeleteTopic = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this topic?');
    if (!confirmed) return false;
    
    try {
      const success = await deleteTopic(id);
      if (success && selectedTopic?._id === id) {
        router.push('/topics');
      }
      return success;
    } catch (error) {
      console.error('Failed to delete topic:', error);
      return false;
    }
  };

  // Handle add material
  const handleAddMaterial = () => {
    if (!selectedTopic) return;
    router.push(`/materials/add?topicId=${selectedTopic._id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Learning Topics</h1>
        <div className="flex space-x-4">
          {selectedTopic && (
            <>
              <PathToggle viewMode={viewMode} onChange={setViewMode} />
              <Button 
                variant="outline" 
                onClick={handleAddMaterial}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </>
          )}
          <Button onClick={() => {
            setNewTopicName('');
            setShowAddDialog(true);
          }}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Topic
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar - Topic list */}
        <div className="md:col-span-1">
          <TopicList 
            topics={userData?.topics || []}
            onAddTopic={() => {
              setNewTopicName('');
              setShowAddDialog(true);
            }}
            onEditTopic={(topic) => {
              setNewTopicName(topic.name || '');
              setShowEditDialog(true);
            }}
            onDeleteTopic={handleDeleteTopic}
            onSelectTopic={handleSelectTopic}
            selectedTopicId={selectedTopic?._id || null}
          />
        </div>

        {/* Right area - Content view (List or Path) */}
        <div className="md:col-span-2">
          {selectedTopic ? (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-bold mb-4">{selectedTopic.name}</h2>
              
              {viewMode === 'list' ? (
                // List view
                <div className="space-y-4">
                  {materials.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No materials yet. Add your first learning material!</p>
                      <Button 
                        className="mt-4" 
                        variant="outline" 
                        onClick={handleAddMaterial}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Material
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {/* MaterialList component will be added here */}
                      <p>Material list will be displayed here</p>
                    </div>
                  )}
                </div>
              ) : (
                // Path view
                <LearningPathFlow 
                  materials={materials}
                  topicId={selectedTopic._id || null}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 px-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No topic selected</h3>
              <p className="text-gray-500 text-center mb-6">Select a topic from the list or create a new one to get started.</p>
              <Button onClick={() => {
                setNewTopicName('');
                setShowAddDialog(true);
              }}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Topic
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Topic Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Topic Name</Label>
              <Input
                id="name"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Enter topic name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTopic} disabled={isLoading || !newTopicName.trim()}>
              {isLoading ? 'Creating...' : 'Create Topic'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Topic Name</Label>
              <Input
                id="edit-name"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Enter topic name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTopic} disabled={isLoading || !newTopicName.trim()}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 