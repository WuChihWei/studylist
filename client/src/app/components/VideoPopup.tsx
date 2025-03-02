import React, { useState, useEffect, useRef } from 'react';
import styles from './VideoPopup.module.css';
import { Pause, Play, X, ExternalLink } from 'lucide-react';

// YouTube API 類型定義
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: any;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  unitMinutes: number;
}

export default function VideoPopup({ isOpen, onClose, url, title, unitMinutes }: VideoPopupProps) {
  const [timeRemaining, setTimeRemaining] = useState(unitMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showContent, setShowContent] = useState(true);
  const [videoWindow, setVideoWindow] = useState<Window | null>(null);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const [iframeError, setIframeError] = useState(false);
  const originalTitle = useRef(document.title);
  const faviconRef = useRef<HTMLLinkElement | null>(null);

  // 创建或获取favicon元素
  useEffect(() => {
    // 保存原始标题
    originalTitle.current = document.title;
    
    // 查找现有的favicon
    faviconRef.current = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    
    // 如果没有找到favicon，创建一个
    if (!faviconRef.current) {
      faviconRef.current = document.createElement('link');
      faviconRef.current.rel = 'shortcut icon';
      document.head.appendChild(faviconRef.current);
    }
    
    // 清理函数
    return () => {
      // 恢复原始标题
      document.title = originalTitle.current;
      
      // 恢复原始favicon（如果有）
      if (faviconRef.current && faviconRef.current.dataset.original) {
        faviconRef.current.href = faviconRef.current.dataset.original;
      }
    };
  }, []);

  // 更新标签页标题和图标
  useEffect(() => {
    if (!isOpen) {
      // 如果弹窗关闭，恢复原始标题
      document.title = originalTitle.current;
      return;
    }
    
    if (isTimerRunning) {
      // 格式化时间为MM:SS
      const mins = Math.floor(timeRemaining / 60);
      const secs = timeRemaining % 60;
      const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      // 更新标题
      document.title = `(${timeString}) ${originalTitle.current}`;
      
      // 计算时间百分比
      const totalTime = unitMinutes * 60;
      const percentRemaining = (timeRemaining / totalTime) * 100;
      
      // 根据剩余时间生成不同颜色的favicon
      let color = '#4169E1'; // 蓝色 - 默认
      
      if (percentRemaining <= 0) {
        color = '#FF0000'; // 红色 - 时间结束
      } else if (percentRemaining <= 25) {
        color = '#FFA500'; // 黄色 - 接近结束
      }
      
      // 创建canvas来绘制favicon
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // 绘制圆形
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        // 如果有favicon元素，更新它
        if (faviconRef.current) {
          // 保存原始favicon
          if (!faviconRef.current.dataset.original) {
            faviconRef.current.dataset.original = faviconRef.current.href;
          }
          
          // 设置新的favicon
          faviconRef.current.href = canvas.toDataURL('image/png');
        }
      }
    }
  }, [isOpen, timeRemaining, isTimerRunning, unitMinutes]);

  // Check if URL is from YouTube
  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Load YouTube API if needed
  useEffect(() => {
    if (isYouTubeUrl(url) && showContent && isOpen) {
      // Add YouTube API script if it doesn't exist
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      // Setup YouTube player when API is ready
      window.onYouTubeIframeAPIReady = () => {
        if (showContent && isOpen) {
          initializeYouTubePlayer();
        }
      };

      // If YT is already loaded, initialize player directly
      if (window.YT && window.YT.Player) {
        initializeYouTubePlayer();
      }
    }
  }, [url, showContent, isOpen]);

  // Initialize YouTube player
  const initializeYouTubePlayer = () => {
    const youtubeVideoId = getYouTubeVideoId(url);
    if (!youtubeVideoId) return;

    // Clear existing player if any
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    // Create new player
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 1,
        start: Math.floor(videoCurrentTime),
        rel: 0,
      },
      events: {
        onStateChange: onPlayerStateChange
      }
    });
  };

  // Track player state changes
  const onPlayerStateChange = (event: any) => {
    // Save current time periodically
    const saveTimeInterval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setVideoCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 5000); // Save every 5 seconds

    return () => clearInterval(saveTimeInterval);
  };

  // Handle iframe load error
  const handleIframeError = () => {
    console.log("Iframe loading failed, X-Frame-Options might be preventing embedding");
    setIframeError(true);
  };

  // Handle opening the content
  useEffect(() => {
    if (isOpen) {
      // Reset timer when popup opens
      setTimeRemaining(unitMinutes * 60);
      setIsTimerRunning(true);
      setShowContent(true);
      setIframeError(false);
    }
  }, [isOpen, unitMinutes]);

  // Open in external window when iframe fails
  const openInExternalWindow = () => {
    const newWindow = window.open(url, '_blank');
    setVideoWindow(newWindow);
  };

  // Timer countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isTimerRunning && timeRemaining > 0 && isOpen) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeRemaining, isTimerRunning, isOpen]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle timer pause/play
  const toggleTimer = () => {
    setIsTimerRunning(prev => !prev);
  };

  // Save video time before closing
  const handleCloseContent = () => {
    if (isYouTubeUrl(url) && playerRef.current && playerRef.current.getCurrentTime) {
      setVideoCurrentTime(playerRef.current.getCurrentTime());
    }
    setShowContent(false);
  };

  // Reopen content
  const reopenContent = () => {
    if (iframeError) {
      openInExternalWindow();
    } else {
      setShowContent(true);
    }
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (popupRef.current) {
      setIsDragging(true);
      const rect = popupRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 处理关闭弹窗
  const handleClose = () => {
    // 恢复原始标题
    document.title = originalTitle.current;
    
    // 恢复原始favicon（如果有）
    if (faviconRef.current && faviconRef.current.dataset.original) {
      faviconRef.current.href = faviconRef.current.dataset.original;
    }
    
    // 调用原始关闭函数
    onClose();
  };

  if (!isOpen) return null;

  // Get YouTube video ID if applicable
  const youtubeVideoId = isYouTubeUrl(url) ? getYouTubeVideoId(url) : null;

  return (
    <>
      {/* Floating timer */}
      <div 
        ref={popupRef}
        className={styles.floatingTimer}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <div className={styles.timerHeader} onMouseDown={handleMouseDown}>
          <div className={styles.timerTime}>
            {formatTime(timeRemaining)}
          </div>
          <div className={styles.timerInfo}>
            Left
          </div>
        </div>
        
        <div className={styles.timerControls}>
          <button 
            className={styles.doneButton}
            onClick={handleClose}
          >
            Done
          </button>
          <button 
            className={styles.playPauseButton}
            onClick={toggleTimer}
          >
            {isTimerRunning ? 
              <Pause size={24} className={styles.pauseIcon} /> : 
              <Play size={24} className={styles.playIcon} />
            }
          </button>
        </div>
        
        {/* Button to reopen content if it was closed */}
        <div className={styles.reopenContainer}>
          <button 
            className={styles.reopenButton}
            onClick={reopenContent}
          >
            {showContent ? 'Hide Content' : 'Show Content'}
          </button>
        </div>

        {/* Display current video time for YouTube videos */}
        {isYouTubeUrl(url) && videoCurrentTime > 0 && (
          <div className={styles.videoProgressInfo}>
            Last position: {Math.floor(videoCurrentTime / 60)}:{Math.floor(videoCurrentTime % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Content Popup */}
      {showContent && (
        <div className={styles.videoOverlay}>
          <div className={styles.videoContainer}>
            <div className={styles.videoHeader}>
              <h3>{title}</h3>
              <div className={styles.headerButtons}>
                {iframeError && (
                  <button 
                    className={styles.externalButton}
                    onClick={openInExternalWindow}
                    title="Open in new window"
                  >
                    <ExternalLink size={18} />
                  </button>
                )}
                <button 
                  className={styles.closeButton}
                  onClick={handleCloseContent}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* YouTube content */}
            {isYouTubeUrl(url) && youtubeVideoId && (
              <div id="youtube-player" className={styles.videoFrame}></div>
            )}
            
            {/* Non-YouTube content */}
            {!isYouTubeUrl(url) && !iframeError && (
              <iframe 
                ref={iframeRef}
                src={url} 
                className={styles.videoFrame}
                onError={handleIframeError}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
            
            {/* Fallback for iframe errors */}
            {iframeError && (
              <div className={styles.iframeErrorContainer}>
                <p>This content cannot be embedded due to security restrictions.</p>
                <button 
                  className={styles.openExternalButton}
                  onClick={openInExternalWindow}
                >
                  Open in New Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}