import React, { useState, useEffect, useRef } from 'react';
import styles from './ContributionGraph.module.css';
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

interface ContributionData {
  date: string;
  count: number;
  studyCount: number;
}

interface ContributionGraphProps {
  data?: ContributionData[];
  activeView: string;
}

// 將函數移到組件外部
const generateSquares = (startDate: Date, totalDays: number, contributionData: ContributionData[]) => {
  return [...Array(totalDays)].map((_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const existingData = contributionData.find(d => d.date === dateStr);
    return {
      date: dateStr,
      count: existingData ? existingData.count : 0,
      studyCount: existingData ? existingData.studyCount : 0
    };
  });
};

const ContributionGraph = ({ data = [], activeView }: ContributionGraphProps) => {
  console.log('5. ContributionGraph received data:', data);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [squares, setSquares] = useState<ContributionData[]>(() => {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // 1月1日
    const endDate = new Date(currentYear, 11, 31); // 12月31日
    
    const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const totalDays = weeks * 7;
    
    return generateSquares(startDate, totalDays, data);
  });

  useEffect(() => {
    if (data.length > 0) {
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, 0, 1);
      const endDate = new Date(currentYear, 11, 31);
      
      const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const totalDays = weeks * 7;
      
      const newSquares = generateSquares(startDate, totalDays, data);
      setSquares(newSquares);
    }
  }, [data]);

  const getContributionColor = (count: number, studyCount: number = 0) => {
    // 如果有學習記錄，優先顯示學習顏色
    if (studyCount > 0) {
      if (studyCount === 1) return 'var(--study-l1)';
      if (studyCount === 2) return 'var(--study-l2)';
      if (studyCount === 3) return 'var(--study-l3)';
      return 'var(--study-l4)';
    }
    
    // 如果只有收藏記錄
    if (count === 0) return 'var(--contribution-empty)';
    if (count <= 1) return 'var(--contribution-l1)';
    if (count <= 3) return 'var(--contribution-l2)';
    if (count <= 6) return 'var(--contribution-l3)';
    return 'var(--contribution-l4)';
  };

  const getMonths = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
    return months;
  };

  const currentYear = new Date().getFullYear();
  const months = getMonths();
  const days = ['Mon', '', 'Wed', '', 'Fri', '', ''] as const;

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = container.clientWidth * 0.5; // 滾動半個視窗寬度
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // 新增計算每月第一天位置的函數
  const getMonthPositions = () => {
    const positions: { [key: string]: number } = {};
    let currentColumn = 0;
    
    squares.forEach((square, index) => {
      const date = new Date(square.date);
      if (date.getDate() === 1) {  // 如果是每月第一天
        const monthKey = months[date.getMonth()];
        positions[monthKey] = Math.floor(index / 7);  // 計算列位置
      }
    });
    
    return positions;
  };

  const monthPositions = getMonthPositions();

  return (
    <div className={styles.graphContainer}>
      <div className={styles.header}>
        <div className={styles.yearInfo}>
          <div className={styles.yearNavigation}>
            <button className={styles.navButton} onClick={() => handleScroll('left')}>
              <MdOutlineKeyboardArrowLeft />
            </button>
            <h5 className={styles.yearLabel}>{currentYear}</h5>
            <button className={styles.navButton} onClick={() => handleScroll('right')}>
              <MdOutlineKeyboardArrowRight />
            </button>
          </div>
          {activeView === 'materials' ? (
            <div className={styles.collectLegend}>
              <span>No Collect</span>
              <div className={`${styles.collectScale} ${styles.materialsScale}`}>
                <div className={styles.collectDot}></div>
                <div className={styles.collectDot}></div>
                <div className={styles.collectDot}></div>
                <div className={styles.collectDot}></div>
                <div className={styles.collectDot}></div>
              </div>
              <span>Great Collect</span>
            </div>
          ) : (
            <div className={styles.collectLegend}>
              <span>Only Collect</span>
              <div className={`${styles.collectScale} ${styles.studyScale}`}>
                <div className={styles.collectDot}></div>
                <div className={styles.collectDot}></div>
                <div className={styles.collectDot}></div>
                <div className={styles.collectDot}></div>
                <div className={styles.collectDot}></div>
              </div>
              <span>Finished</span>
            </div>
          )}
        </div>
      </div>
      <div className={styles.graphScrollContainer} ref={scrollContainerRef}>
        <div className={styles.graph}>
          <ul className={styles.months}>
            {months.map(month => (
              <li 
                key={month} 
                style={{ 
                  gridColumn: monthPositions[month] + 1,
                  gridColumnEnd: 'span 1'
                }}
              >
                {month}
              </li>
            ))}
          </ul>
          <ul className={styles.days}>
            {days.map((day, index) => (
              <li key={index}>{day}</li>
            ))}
          </ul>
          <ul className={styles.squares}>
            {squares.map((square, i) => (
              <li
                key={i}
                style={{ backgroundColor: getContributionColor(square.count, square.studyCount) }}
                title={`${square.date}: ${square.count} collections, ${square.studyCount || 0} studies`}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;