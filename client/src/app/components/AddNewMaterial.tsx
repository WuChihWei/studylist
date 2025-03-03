'use client';

import React, { useState } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { MdWeb } from "react-icons/md";
import { FiVideo, FiBook } from "react-icons/fi";
import { HiOutlineMicrophone } from "react-icons/hi";
import { Link as LinkIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import styles from './AddNewMaterial.module.css';

interface AddNewMaterialProps {
  onSubmit: (material: {
    title: string;
    type: string;
    url: string | null;
  }) => void;
  placeholder?: string;
}

const AddNewMaterial = ({ onSubmit, placeholder = "Add New Material..." }: AddNewMaterialProps) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedType, setSelectedType] = useState('webpage');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const categoryIcons = {
    webpage: <MdWeb size={18} />,
    video: <FiVideo size={18} />,
    podcast: <HiOutlineMicrophone size={18} />,
    book: <FiBook size={18} />
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({
        title: title.trim(),
        type: selectedType,
        url: url.trim() || null
      });
      setTitle('');
      setUrl('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.addNewMaterialContainer}>
        {/* 左側圓形 + 按鈕 */}
        <button type="button" className={styles.addButton}>
          <FaPlus className={styles.plusIcon} />
        </button>

        {/* 類型選擇 */}
        <div className={styles.typeSelector}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={styles.typeButton}>
                {categoryIcons[selectedType]}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setSelectedType('webpage')}>
                <MdWeb size={18} className={styles.menuIcon} />
                <span>Webpage</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedType('video')}>
                <FiVideo size={18} className={styles.menuIcon} />
                <span>Video</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedType('podcast')}>
                <HiOutlineMicrophone size={18} className={styles.menuIcon} />
                <span>Podcast</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedType('book')}>
                <FiBook size={18} className={styles.menuIcon} />
                <span>Book</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 輸入框 */}
        <input
          type="text"
          className={styles.materialInput}
          placeholder={placeholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* URL 輸入按鈕 */}
        <button 
          type="button" 
          className={`${styles.urlButton} ${showUrlInput ? styles.active : ''}`}
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          <LinkIcon size={16} />
        </button>

        {/* 右側搜尋圖示 */}
        <button type="submit" className={styles.searchButton}>
          <FaSearch className={styles.searchIcon} />
        </button>
      </form>

      {/* URL 輸入框 */}
      {showUrlInput && (
        <div className={styles.urlInputContainer}>
          <input
            type="url"
            className={styles.urlInput}
            placeholder="Enter URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default AddNewMaterial; 