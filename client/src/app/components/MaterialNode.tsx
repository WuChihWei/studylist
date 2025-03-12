'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FiBook, FiVideo, FiExternalLink } from "react-icons/fi";
import { HiOutlineMicrophone } from "react-icons/hi";
import { LuGlobe } from "react-icons/lu";
import { FaCheck } from "react-icons/fa";
import { BiWorld } from "react-icons/bi";

// 定義節點類型對應的圖標
const TYPE_ICONS = {
  video: FiVideo,
  book: FiBook,
  podcast: HiOutlineMicrophone,
  webpage: LuGlobe
};

interface MaterialNodeData {
  label: string;
  type: string;
  favicon?: string | null;
  url?: string | null;
  completed?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const MaterialNode = ({ data }: NodeProps<MaterialNodeData>) => {
  const { label, type, favicon, url, completed, size = 'medium' } = data;
  const TypeIcon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || LuGlobe;

  // Calculate sizes based on node size
  const nodeSizes = {
    small: { width: 'w-36', padding: 'p-2', icon: 'w-4 h-4', font: 'text-xs' },
    medium: { width: 'w-48', padding: 'p-3', icon: 'w-5 h-5', font: 'text-sm' },
    large: { width: 'w-64', padding: 'p-4', icon: 'w-6 h-6', font: 'text-base' }
  };

  const { width, padding, icon, font } = nodeSizes[size];

  return (
    <div className={`${padding} rounded-lg shadow-md ${width} ${completed ? 'bg-green-50' : 'bg-white'} transition-all relative`}>
      {/* 四個方向的連接點 - 可作為來源和目標 */}
      <Handle type="source" position={Position.Top} className="w-3 h-3 z-10" id="top" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 z-10" id="right" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 z-10" id="bottom" />
      <Handle type="source" position={Position.Left} className="w-3 h-3 z-10" id="left" />
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 z-10" id="top" />
      <Handle type="target" position={Position.Right} className="w-3 h-3 z-10" id="right" />
      <Handle type="target" position={Position.Bottom} className="w-3 h-3 z-10" id="bottom" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 z-10" id="left" />
      
      <div className="flex items-center mb-2">
        <div className="flex-shrink-0 mr-2">
          {favicon ? (
            <img 
              src={favicon} 
              alt={label} 
              className={`${icon} rounded-sm`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <TypeIcon className={`${icon} text-gray-600 ${favicon ? 'hidden' : ''}`} />
        </div>
        
        {url ? (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`flex-1 truncate font-medium ${font} text-blue-600 hover:text-blue-800 hover:underline flex items-center group`}
          >
            {label}
            <FiExternalLink className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity w-3 h-3" />
          </a>
        ) : (
          <div className={`flex-1 truncate font-medium ${font}`}>
            {label}
          </div>
        )}
        
        {completed && (
          <div className="flex-shrink-0 ml-1">
            <FaCheck className={`${icon} text-green-600`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(MaterialNode); 