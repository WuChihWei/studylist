import React from 'react';
import TopicItem from '../TopicList/TopicItem';
import { Button } from '@/app/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Topic } from '@/types/User';

interface TopicListProps {
  topics: Topic[];
  onAddTopic: () => void;
  onEditTopic: (topic: Topic) => void;
  onDeleteTopic: (topicId: string) => Promise<boolean>;
  onSelectTopic: (topicId: string) => void;
  selectedTopicId: string | null;
}

export default function TopicList({
  topics,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onSelectTopic,
  selectedTopicId
}: TopicListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Topics</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onAddTopic}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Topic
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {topics.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No topics yet. Create your first topic to get started!</p>
          </div>
        ) : (
          topics.map((topic) => (
            <TopicItem 
              key={topic._id || ''}
              topic={topic}
              isSelected={selectedTopicId === topic._id}
              onEdit={() => onEditTopic(topic)}
              onDelete={() => onDeleteTopic(topic._id || '')}
              onSelect={() => onSelectTopic(topic._id || '')}
            />
          ))
        )}
      </div>
    </div>
  );
} 