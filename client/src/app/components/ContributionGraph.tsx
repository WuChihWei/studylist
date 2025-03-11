import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ListLayout from '../database/ListLayout';

export interface ContributionData {
  date: string;
  count: number;
  studyCount?: number;
}

interface ContributionGraphProps {
  data: ContributionData[];
  activeView: 'month' | 'year';
  userData?: {
    photoURL?: string;
    name?: string;
    email?: string;
  };
  onEditProfile?: () => void;
  onViewChange?: (view: 'month' | 'year') => void;
}

interface MonthData {
  month: string;
  grid: (string | null)[][];
  firstDayOfWeek: number;
  weeksCount: number;
  startPosition: number;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekdays = ['S', 'S', 'M', 'T', 'W', 'T', 'F'];

const ContributionGraph: React.FC<ContributionGraphProps> = ({ 
  data, 
  activeView,
  userData,
  onEditProfile,
  onViewChange
}) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Calculate total contribution minutes
  const totalContributions = data.reduce((sum, item) => sum + item.count, 0);
  
  // Generate contribution map for quick lookup
  const contributionMap = data.reduce<{[key: string]: number}>((acc, item) => {
    acc[item.date] = item.count;
    return acc;
  }, {});

  const handlePrevYear = () => {
    setYear(prevYear => prevYear - 1);
  };

  const handleNextYear = () => {
    setYear(prevYear => prevYear + 1);
  };

  const getContributionColor = (count: number): string => {
    if (count === 0) return 'bg-[#ebedf0]';
    if (count < 2) return 'bg-[#9be9a8]';
    if (count < 5) return 'bg-[#40c463]';
    if (count < 10) return 'bg-[#30a14e]';
    return 'bg-[#216e39]';
  };

  const handleCellMouseEnter = (e: React.MouseEvent, date: string, count: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipContent(`${new Date(date).toDateString()}: ${count} contributions`);
    setTooltipPosition({ 
      x: rect.left + window.scrollX + rect.width / 2, 
      y: rect.top + window.scrollY - 28 
    });
    setShowTooltip(true);
  };

  const handleCellMouseLeave = () => {
    setShowTooltip(false);
  };

  const generateContributionGraph = () => {
    const monthsData: MonthData[] = [];
    let totalWeeks = 0;
    
    // Generate data for each month
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Calculate number of weeks needed for this month
      const weeksCount = Math.ceil((daysInMonth + firstDayOfWeek) / 7);
      
      // Create a grid for this month (7 days x weeks needed)
      const monthGrid: (string | null)[][] = Array(7).fill(null).map(() => Array(weeksCount).fill(null));
      
      // Fill in the dates for this month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const weekInMonth = Math.floor((day + firstDayOfWeek - 1) / 7);
        const dateStr = date.toISOString().split('T')[0];
        monthGrid[dayOfWeek][weekInMonth] = dateStr;
      }
      
      monthsData.push({
        month: months[month],
        grid: monthGrid,
        firstDayOfWeek,
        weeksCount,
        startPosition: totalWeeks
      });
      
      totalWeeks += weeksCount;
    }
    
    const cellSize = 13;
    const cellGap = 2;
    const cellWithGap = cellSize + cellGap;
    
    return (
      <div className="relative pl-2">
        {/* Month labels */}
        <div className="flex mb-4">
          {monthsData.map(({ month, weeksCount, startPosition }) => (
            <div
              key={month}
              className="text-xs text-[#767676] absolute"
              style={{
                left: `${startPosition * cellWithGap + 52}px`,
              }}
            >
              {month}
            </div>
          ))}
        </div>
        
        <div className="flex">
          {/* Weekday labels */}
          <div className="flex flex-col gap-[2px] mr-2">
            {weekdays.map((day) => (
              <div key={day} className="h-[13px] text-xs text-[#767676] pr-2 flex items-center justify-end w-6">
                {day}
              </div>
            ))}
          </div>
          
          {/* All months grid */}
          <div className="flex gap-[2px]">
            {monthsData.map(({ month, grid }) => (
              <div key={month} className="flex gap-[2px] ml-1">
                {grid[0].map((_, weekIndex) => (
                  <div key={`${month}-week-${weekIndex}`} className="flex flex-col gap-[2px]">
                    {Array(7).fill(null).map((_, dayIndex) => {
                      const dateStr = grid[dayIndex][weekIndex];
                      const count = dateStr ? (contributionMap[dateStr] || 0) : 0;
                      const isEmpty = dateStr === null;
                      
                      return (
                        <div
                          key={`${month}-${weekIndex}-${dayIndex}`}
                          className={`w-[13px] h-[13px] rounded-sm ${isEmpty ? '' : getContributionColor(count)}`}
                          onMouseEnter={dateStr ? (e) => handleCellMouseEnter(e, dateStr, count) : undefined}
                          onMouseLeave={dateStr ? handleCellMouseLeave : undefined}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-10">
      {/* View Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeView === 'month' 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => onViewChange?.('month')}
          >
            Graph
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeView === 'year' 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => onViewChange?.('year')}
          >
            List
          </button>
        </div>
      </div>
      
      {/* Calendar Container */}
      <div className="relative mt-4">
        {activeView === 'month' ? (
          <>
            {generateContributionGraph()}
            {showTooltip && (
              <div 
                className="fixed z-50 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs pointer-events-none transform -translate-x-1/2"
                style={{ 
                  left: `${tooltipPosition.x}px`, 
                  top: `${tooltipPosition.y}px`,
                }}
              >
                {tooltipContent}
              </div>
            )}
          </>
        ) : (
          <ListLayout 
            data={data} 
            year={year}
            userData={userData}
            onEditProfile={onEditProfile}
            totalContributions={totalContributions}
          />
        )}
      </div>
      
      {/* Year navigation */}
      <div className="flex justify-between mt-4">
        <button 
          onClick={handlePrevYear}
          className="p-1 hover:bg-gray-100 rounded-full"
          aria-label="Previous Year"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button 
          onClick={handleNextYear}
          className="p-1 hover:bg-gray-100 rounded-full"
          aria-label="Next Year"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      {activeView === 'month' && (
        <div className="flex items-center gap-1 mt-4 justify-end text-xs text-[#767676]">
          <span>Less</span>
          <div className="w-[13px] h-[13px] rounded-sm bg-[#ebedf0]"></div>
          <div className="w-[13px] h-[13px] rounded-sm bg-[#9be9a8]"></div>
          <div className="w-[13px] h-[13px] rounded-sm bg-[#40c463]"></div>
          <div className="w-[13px] h-[13px] rounded-sm bg-[#30a14e]"></div>
          <div className="w-[13px] h-[13px] rounded-sm bg-[#216e39]"></div>
          <span>More</span>
        </div>
      )}
    </div>
  );
};

export default ContributionGraph;