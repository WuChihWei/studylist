import React from 'react';
import { useRouter } from 'next/navigation';
import { Topic } from '@/types/User';
import { PlusCircle } from 'lucide-react';

interface SidebarTopicsProps {
  topics: Topic[];
  onSelectTopic: (topicId: string) => void;
  currentTopicId: string | null;
}

export default function SidebarTopics({ 
  topics, 
  onSelectTopic, 
  currentTopicId
}: SidebarTopicsProps) {
  const router = useRouter();
  
  const handleAddTopic = () => {
    router.push('/database/add-topic');
  };
  
  return (
    <div className="space-y-1 py-1">
      {topics.length === 0 ? (
        <p className="text-xs text-gray-500 italic px-2 py-1">No topics yet</p>
      ) : (
        topics.map((topic) => (
          <button
            key={topic._id || 'unknown'}
            className={`
              flex items-center w-full px-2 py-1.5 text-sm rounded-md transition-colors text-left
              ${currentTopicId === topic._id 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-gray-600 hover:bg-gray-100'}
            `}
            onClick={() => onSelectTopic(topic._id || '')}
          >
            <span className="truncate">{topic.name}</span>
          </button>
        ))
      )}
      
      <button
        className="flex items-center w-full px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md mt-1"
        onClick={handleAddTopic}
      >
        <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
        <span className="text-xs">Add Topic</span>
      </button>
    </div>
  );
} 