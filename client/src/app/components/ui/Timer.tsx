import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Material } from '@/types/User';

interface TimerProps {
  minutes: number;
  onComplete: () => void;
  onClose: () => void;
  isOpen: boolean;
  material?: Material;
}

const Timer: React.FC<TimerProps> = ({ minutes, onComplete, onClose, isOpen, material }) => {
  const [seconds, setSeconds] = useState(minutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const totalSeconds = minutes * 60;

  // Reset timer when minutes prop changes
  useEffect(() => {
    setSeconds(minutes * 60);
    setIsRunning(true);
  }, [minutes]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    } else if (seconds === 0) {
      setIsRunning(false);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, seconds]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[400px] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Study Timer ({minutes} minutes)
            </h3>
            {material && (
              <p className="text-sm text-gray-500 mt-1 truncate">
                {material.title}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Timer Content */}
        <div className="px-6 py-8">
          {/* Time Display */}
          <div className="text-center mb-8">
            <div className="text-6xl font-mono text-gray-900 mb-4 font-light tracking-tight">
              {formatTime(seconds)}
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${isRunning 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }
              `}
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            
            <button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer; 