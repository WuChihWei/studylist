import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, Headphones, Video, BookOpen } from 'lucide-react';

interface MaterialType {
  id: string;
  name: string;
  icon: React.ElementType;
}

const materialTypes: MaterialType[] = [
  { id: 'webpage', name: 'Web', icon: Globe },
  { id: 'podcast', name: 'Podcast', icon: Headphones },
  { id: 'video', name: 'Video', icon: Video },
  { id: 'book', name: 'Book', icon: BookOpen },
];

export default function SidebarMaterials() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams?.get('type');
  const currentTopicId = searchParams?.get('topic');
  
  const handleFilterChange = (typeId: string) => {
    // If we're already on a topic page, add the filter parameter
    if (currentTopicId) {
      router.push(`/topics?topic=${currentTopicId}&type=${typeId}`);
    } else {
      // Otherwise go to the database page with the filter
      router.push(`/database?type=${typeId}`);
    }
  };
  
  return (
    <div className="space-y-1">
      {materialTypes.map((type) => (
        <button
          key={type.id}
          className={`
            flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors
            ${currentType === type.id 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'}
          `}
          onClick={() => handleFilterChange(type.id)}
        >
          <type.icon className="h-4 w-4 mr-2" />
          <span>{type.name}</span>
        </button>
      ))}
    </div>
  );
} 