'use client';

import React from 'react';
import { useUserData } from '@/hooks/useUserData';
import ContributionGraph from '../components/ContributionGraph';

interface ContributionProps {
  limit?: number;
}

export default function Contribution({ limit }: ContributionProps) {
  const { userData } = useUserData();
  
  // Process contribution data
  const contributionData = userData?.contributions || [];
  const displayData = limit ? contributionData.slice(0, limit) : contributionData;
  
  // Calculate total contribution minutes
  const totalMinutes = contributionData.reduce((total, item) => total + (item.count || 0), 0);
  
  return (
    <div className="space-y-6">
      {/* Contribution graph */}
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <h3 className="text-lg font-medium mb-3">Contribution Graph</h3>
        <ContributionGraph 
          contributionData={userData?.contributions || []} 
          showWeekNames={true}
        />
      </div>
      
      {/* Contribution stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase">Total Minutes</div>
          <div className="mt-1 text-2xl font-semibold">{totalMinutes}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase">Active Days</div>
          <div className="mt-1 text-2xl font-semibold">
            {contributionData.filter(d => d.count > 0).length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase">Study Streak</div>
          <div className="mt-1 text-2xl font-semibold">
            {calculateStreak(contributionData)}
          </div>
        </div>
      </div>
      
      {/* Recent contributions */}
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <h3 className="text-lg font-medium mb-3">Recent Activity</h3>
        {displayData.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No contributions yet</p>
        ) : (
          <div className="space-y-3">
            {displayData.map((contribution, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium">
                    {formatDate(contribution.date)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {contribution.studyCount || 0} materials studied
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-blue-600">
                    {contribution.count} mins
                  </div>
                  <div className="text-xs text-gray-500">
                    contribution time
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric' 
  }).format(date);
}

function calculateStreak(contributions: { date: string; count: number }[]): number {
  if (!contributions || contributions.length === 0) return 0;
  
  // Sort contributions by date (newest first)
  const sorted = [...contributions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Find current active streak
  let streak = 0;
  let currentDate = new Date();
  
  // Adjust to start of current day
  currentDate.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sorted.length; i++) {
    const contribDate = new Date(sorted[i].date);
    contribDate.setHours(0, 0, 0, 0);
    
    // Check if this date is exactly one day before current date
    const dayDiff = Math.floor((currentDate.getTime() - contribDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1 && sorted[i].count > 0) {
      streak++;
      currentDate = contribDate;
    } else if (dayDiff > 1) {
      // Break in streak
      break;
    }
  }
  
  return streak;
} 