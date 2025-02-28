import React from 'react';
import styles from './CircleProgress.module.css';

interface CircleProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function CircleProgress({ 
  progress, 
  size = 24, 
  strokeWidth = 3,
  color = '#4169E1'
}: CircleProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <svg 
      width={size} 
      height={size} 
      className="transform -rotate-90 transition-all duration-300 ease-in-out"
    >
      <circle
        className="transition-all duration-300 ease-in-out"
        stroke="#eee"
        strokeWidth={strokeWidth}
        fill="none"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="transition-[stroke-dashoffset] duration-300 ease-in-out"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        fill="none"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
}