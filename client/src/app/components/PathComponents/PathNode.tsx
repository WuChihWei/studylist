import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FiBook, FiVideo } from "react-icons/fi";
import { HiOutlineMicrophone } from "react-icons/hi";
import { LuGlobe } from "react-icons/lu";
import { FaCheck } from "react-icons/fa";
import { PathNodeData } from '@/types/Path';

// Define type icons
const TYPE_ICONS = {
  video: FiVideo,
  book: FiBook,
  podcast: HiOutlineMicrophone,
  webpage: LuGlobe
};

const PathNode = ({ data }: NodeProps<PathNodeData>) => {
  const { label, type, favicon, url, completed } = data;
  const TypeIcon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || LuGlobe;

  return (
    <div className={`p-3 rounded-lg shadow-md w-48 ${completed ? 'bg-green-50' : 'bg-white'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center mb-2">
        <div className="flex-shrink-0 mr-2">
          {favicon ? (
            <img 
              src={favicon} 
              alt={label} 
              className="w-5 h-5 rounded-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <TypeIcon className={`w-5 h-5 text-gray-600 ${favicon ? 'hidden' : ''}`} />
        </div>
        
        <div className="flex-1 truncate font-medium text-sm">
          {label}
        </div>
        
        {completed && (
          <div className="flex-shrink-0 ml-1">
            <FaCheck className="w-4 h-4 text-green-600" />
          </div>
        )}
      </div>
      
      {url && (
        <div className="text-xs text-gray-500 truncate">
          {url.replace(/^https?:\/\/(www\.)?/, '')}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export default memo(PathNode); 