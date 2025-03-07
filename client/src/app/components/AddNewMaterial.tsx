'use client';

import React, { useState, useEffect } from 'react';
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
    favicon?: string | null;
  }) => void;
  placeholder?: string;
}

interface Metadata {
  title?: string;
  logo?: string;
  url?: string;
}

const AddNewMaterial = ({ onSubmit, placeholder = "Add New Material..." }: AddNewMaterialProps) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [favicon, setFavicon] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('webpage');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const categoryIcons = {
    webpage: <MdWeb size={18} />,
    video: <FiVideo size={18} />,
    podcast: <HiOutlineMicrophone size={18} />,
    book: <FiBook size={18} />
  };

  // 當URL輸入框的值變化時，嘗試抓取元數據
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!url || url.trim() === '') return;
      
      // 只在開發環境中輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('開始獲取元數據，URL:', url);
      }
      
      // 確保URL格式正確
      let validUrl = url.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        // 如果包含 www. 但沒有協議，添加 https://
        if (validUrl.startsWith('www.')) {
          validUrl = 'https://' + validUrl;
        } else {
          // 否則添加 https://www.
          validUrl = 'https://www.' + validUrl;
        }
      }
      
      // 只在開發環境中輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('處理後的 URL:', validUrl);
      }
      
      try {
        setIsLoadingMetadata(true);
        const response = await fetch(`/api/get-metadata?url=${encodeURIComponent(validUrl)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: Metadata = await response.json();
        // 只在開發環境中輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log('成功獲取元數據:', data);
        }
        
        // 如果有標題且當前標題為空，則自動填充
        if (data.title && !title) {
          // 只在開發環境中輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.log('設置標題:', data.title);
          }
          setTitle(data.title);
        }
        
        // 設置favicon
        if (data.logo) {
          // 只在開發環境中輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.log('設置 favicon:', data.logo);
          }
          // Ensure the favicon URL is valid
          try {
            // Test if the URL is valid by creating a URL object
            new URL(data.logo);
            // 檢查 URL 是否是圖片
            if (data.logo.includes('google.com/s2/favicons') || 
                data.logo.endsWith('.ico') || 
                data.logo.endsWith('.png') || 
                data.logo.endsWith('.jpg') || 
                data.logo.endsWith('.jpeg') || 
                data.logo.endsWith('.svg')) {
              setFavicon(data.logo);
              // 只在開發環境中輸出日誌
              if (process.env.NODE_ENV === 'development') {
                console.log('有效的 favicon URL，已設置:', data.logo);
              }
            } else {
              // 只在開發環境中輸出日誌
              if (process.env.NODE_ENV === 'development') {
                console.log('URL 不是圖片格式，使用 Google Favicon 服務作為備用');
              }
              const domain = new URL(url).hostname;
              const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
              setFavicon(googleFavicon);
              // 只在開發環境中輸出日誌
              if (process.env.NODE_ENV === 'development') {
                console.log('設置 Google Favicon:', googleFavicon);
              }
            }
          } catch (e) {
            // 只在開發環境中輸出日誌
            if (process.env.NODE_ENV === 'development') {
              console.error('Invalid favicon URL:', data.logo, e);
            }
            // 嘗試使用 Google Favicon 服務作為備用
            try {
              const domain = new URL(url).hostname;
              const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
              setFavicon(googleFavicon);
              // 只在開發環境中輸出日誌
              if (process.env.NODE_ENV === 'development') {
                console.log('設置 Google Favicon:', googleFavicon);
              }
            } catch (err) {
              // 只在開發環境中輸出日誌
              if (process.env.NODE_ENV === 'development') {
                console.error('無法設置 Google Favicon:', err);
              }
              setFavicon(null);
            }
          }
        } else {
          // 只在開發環境中輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.log('沒有獲取到 favicon');
          }
          // 嘗試使用 Google Favicon 服務作為備用
          try {
            const domain = new URL(url).hostname;
            const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            setFavicon(googleFavicon);
            // 只在開發環境中輸出日誌
            if (process.env.NODE_ENV === 'development') {
              console.log('設置 Google Favicon:', googleFavicon);
            }
          } catch (err) {
            // 只在開發環境中輸出日誌
            if (process.env.NODE_ENV === 'development') {
              console.error('無法設置 Google Favicon:', err);
            }
            setFavicon(null);
          }
        }
        
        // 根據URL自動判斷類型
        if (validUrl.includes('youtube.com') || validUrl.includes('youtu.be') || 
            validUrl.includes('vimeo.com') || validUrl.includes('dailymotion.com')) {
          // 只在開發環境中輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.log('檢測到視頻網站，設置類型為 video');
          }
          setSelectedType('video');
        } else if (validUrl.includes('spotify.com') || validUrl.includes('apple.com/podcast') || 
                  validUrl.includes('soundcloud.com')) {
          // 只在開發環境中輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.log('檢測到播客網站，設置類型為 podcast');
          }
          setSelectedType('podcast');
        }
      } catch (error) {
        // 只在開發環境中輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.error('獲取元數據時出錯:', error);
        }
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    
    // 使用防抖，避免用戶輸入過程中頻繁請求
    const debounceTimer = setTimeout(() => {
      if (url) {
        fetchMetadata();
      }
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [url, title]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 只在開發環境中輸出日誌
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 AddNewMaterial - handleSubmit 被觸發', { title, type: selectedType, url, favicon });
    }
    
    onSubmit({
      title,
      type: selectedType,
      url: url || null,
      favicon: favicon || null // Ensure favicon is null if not set
    });
    
    // Reset form
    setTitle('');
    setUrl('');
    setFavicon(null);
    setSelectedType('article');
  };

  // 處理URL貼上事件
  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    console.log('URL 貼上事件觸發，貼上的文本:', pastedText);
    
    if (pastedText) {
      // 不管是否以 http:// 或 https:// 開頭，都設置 URL
      setUrl(pastedText);
      
      // 如果 URL 輸入框尚未顯示，則顯示它
      if (!showUrlInput) {
        setShowUrlInput(true);
      }
    }
  };

  // 監聽標題輸入框的貼上事件
  const handleTitlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    console.log('標題貼上事件觸發，貼上的文本:', pastedText);
    
    // 檢查是否像是 URL
    if (pastedText && (
        pastedText.startsWith('http://') || 
        pastedText.startsWith('https://') || 
        pastedText.includes('www.') || 
        pastedText.includes('.com') || 
        pastedText.includes('.org') || 
        pastedText.includes('.net')
      )) {
      // 如果像是 URL，則設置到 URL 輸入框
      e.preventDefault(); // 阻止默認貼上行為
      setUrl(pastedText);
      setShowUrlInput(true);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.addNewMaterialContainer}>
        {/* 左側圓形 + 按鈕 */}
        <button type="submit" className={styles.addButton}>
          <FaPlus className={styles.plusIcon} />
        </button>

        {/* 類型選擇 */}
        <div className={styles.typeSelector}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={styles.typeButton}>
                {categoryIcons[selectedType as keyof typeof categoryIcons]}
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
          placeholder={isLoadingMetadata ? "Loading metadata..." : placeholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onPaste={handleTitlePaste}
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
            onPaste={handleUrlPaste}
          />
          {isLoadingMetadata && <span className={styles.loadingIndicator}>Loading...</span>}
        </div>
      )}
    </div>
  );
};

export default AddNewMaterial; 