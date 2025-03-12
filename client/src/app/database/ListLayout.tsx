import React, { useState } from 'react';
import { ContributionData } from '../components/ContributionGraph';
import ContributionGraph from '../components/ContributionGraph';
import UnifiedTableView from '../components/UnifiedTableView';
import { Material, Topic } from '@/types/User';
import { Plus, Edit } from 'lucide-react';
import { BiWorld } from 'react-icons/bi';
import { FiVideo, FiBook } from 'react-icons/fi';
import { HiOutlineMicrophone } from 'react-icons/hi';
import { EditProfileDialog } from '../components/EditProfileDialog';

interface ListLayoutProps {
  data: ContributionData[];
  year: number;
  userData?: {
    photoURL?: string;
    name?: string;
    email?: string;
    topics?: Topic[];
    bio?: string;
  };
  onEditProfile?: () => void;
  totalContributions: number;
  contributions?: ContributionData[];
  materials: Material[];
  categoryFilters: {
    web: boolean;
    video: boolean;
    podcast: boolean;
    book: boolean;
  };
  setCategoryFilters: (filters: {
    web: boolean;
    video: boolean;
    podcast: boolean;
    book: boolean;
  }) => void;
  listSubMode: 'list' | 'grid';
  setListSubMode: (mode: 'list' | 'grid') => void;
  showAddNewMaterial: boolean;
  setShowAddNewMaterial: (show: boolean) => void;
  topicId: string;
  refreshKey: number;
  unitMinutes: number;
  setUnitMinutes: (minutes: number) => void;
  onUpdateProgress: (materialId: string, completed: number, total: number) => Promise<boolean>;
  onComplete: (materialId: string, isCompleted: boolean) => Promise<void>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onReorderItems: (items: Material[]) => Promise<void>;
  onTopicChange: (id: string) => void;
  onAddTopic: () => void;
  currentTopic?: Topic;
  isAllTopics?: boolean;
}

const ListLayout: React.FC<ListLayoutProps> = ({ 
  data, 
  year, 
  userData, 
  onEditProfile, 
  totalContributions,
  contributions,
  materials,
  categoryFilters,
  setCategoryFilters,
  listSubMode,
  setListSubMode,
  showAddNewMaterial,
  setShowAddNewMaterial,
  topicId,
  refreshKey,
  unitMinutes,
  setUnitMinutes,
  onUpdateProgress,
  onComplete,
  onEdit,
  onDelete,
  onReorderItems,
  onTopicChange,
  onAddTopic,
  currentTopic,
  isAllTopics
}) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  // Get unique tags from all topics and ensure they are all strings
  const existingTags = Array.from(
    new Set(
      userData?.topics
        ?.map(topic => topic.tags)
        .flat()
        .filter((tag): tag is string => Boolean(tag)) || []
    )
  );

  const handleEditProfile = () => {
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (name: string, bio: string, tags: string[]) => {
    if (onEditProfile) {
      // You'll need to implement the actual save logic in the parent component
      onEditProfile();
    }
  };

  // Group contributions by month
  const groupedByMonth = data.reduce<{ [key: string]: ContributionData[] }>((acc, item) => {
    const date = new Date(item.date);
    if (date.getFullYear() === year) {
      const monthKey = date.toLocaleString('default', { month: 'long' });
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(item);
    }
    return acc;
  }, {});

  // Sort contributions within each month by date
  Object.values(groupedByMonth).forEach(monthData => {
    monthData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  interface CategoryButtonProps {
    type: 'all' | 'webpage' | 'video' | 'podcast' | 'book';
    icon: React.ReactNode;
    count: number;
    isActive: boolean;
    onClick: () => void;
  }

  const CategoryButton: React.FC<CategoryButtonProps> = ({ type, icon, count, isActive, onClick }) => {
    const label = type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1);
    
    return (
      <button
        className={`px-4 py-2 text-sm rounded-full flex items-center ${
          isActive
            ? 'bg-gray-900 text-white font-medium'
            : ' text-gray-700 hover:bg-gray-200'
        }`}
        onClick={onClick}
      >
        <span className="flex items-center justify-center w-5 h-5 mr-2">
          {icon}
        </span>
        {label} ({count})
      </button>
    );
  };

  const allIcon = (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );

  const categoryButtons = [
    {
      type: 'all' as const,
      icon: allIcon,
      count: materials.length,
      isActive: categoryFilters.web && categoryFilters.video && categoryFilters.podcast && categoryFilters.book,
      onClick: () => setCategoryFilters({ web: true, video: true, podcast: true, book: true })
    },
    {
      type: 'webpage' as const,
      icon: <BiWorld className="w-4 h-4" />,
      count: materials.filter(m => m.type === 'webpage').length,
      isActive: categoryFilters.web && !categoryFilters.video && !categoryFilters.podcast && !categoryFilters.book,
      onClick: () => setCategoryFilters({ web: true, video: false, podcast: false, book: false })
    },
    {
      type: 'video' as const,
      icon: <FiVideo className="w-4 h-4" />,
      count: materials.filter(m => m.type === 'video').length,
      isActive: !categoryFilters.web && categoryFilters.video && !categoryFilters.podcast && !categoryFilters.book,
      onClick: () => setCategoryFilters({ web: false, video: true, podcast: false, book: false })
    },
    {
      type: 'podcast' as const,
      icon: <HiOutlineMicrophone className="w-4 h-4" />,
      count: materials.filter(m => m.type === 'podcast').length,
      isActive: !categoryFilters.web && !categoryFilters.video && categoryFilters.podcast && !categoryFilters.book,
      onClick: () => setCategoryFilters({ web: false, video: false, podcast: true, book: false })
    },
    {
      type: 'book' as const,
      icon: <FiBook className="w-4 h-4" />,
      count: materials.filter(m => m.type === 'book').length,
      isActive: !categoryFilters.web && !categoryFilters.video && !categoryFilters.podcast && categoryFilters.book,
      onClick: () => setCategoryFilters({ web: false, video: false, podcast: false, book: true })
    }
  ];

  return (
    <div>
      {/* User Profile and Contribution Graph Section */}
      <div className="bg-white shadow-sm w-full pb-4">
        <div className="flex flex-col lg:flex-row">
          {/* User Profile Section */}
          <div className="w-full lg:w-1/2">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                {userData?.photoURL ? (
                  <img
                    className="h-20 w-20 rounded-full"
                    src={userData.photoURL}
                    alt={userData.name || 'User'}
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-800 font-medium text-2xl">
                      {userData?.name?.substring(0, 1) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {userData?.name || 'Anonymous User'}
                </h2>
                <h5 className="text-gray-600 pr-4">
                  {userData?.bio || 'No bio available'}
                </h5>
                {userData?.topics && userData.topics.map(topic => topic.tags).flat().filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Array.from(new Set(userData.topics.map(topic => topic.tags).flat().filter(Boolean)))
                      .map((tag, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <button
                    onClick={handleEditProfile}
                    className="text-blue-600 text-sm font-medium hover:text-blue-800"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contribution Graph Section */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white overflow-hidden">
              {contributions && (
                <ContributionGraph 
                  data={contributions.map(c => ({
                    date: c.date,
                    count: c.count || 0,
                    studyCount: 0
                  })) || []} 
                  activeView="month"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Topic Navigation */}
      <div className="flex flex-col items-stretch mb-8 mt-4">
        
        <div className="flex justify-between items-center">
          <h1 className="flex items-center">
            {currentTopic?.name || "Topic"}
            <button className="ml-2 text-gray-400 hover:text-gray-600">
              <Edit className="h-4 w-4" />
            </button>
          </h1>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-1">
          {categoryButtons.map((button) => (
            <CategoryButton
              key={button.type}
              {...button}
            />
          ))}
        </div>
      </div>

      {/* Materials List */}
      <UnifiedTableView
        materials={materials
          .filter(material => {
            if (categoryFilters.web && categoryFilters.video && categoryFilters.podcast && categoryFilters.book) {
              return true; // Show all if all filters are active
            }
            return (
              (categoryFilters.web && material.type === 'webpage') ||
              (categoryFilters.video && material.type === 'video') ||
              (categoryFilters.podcast && material.type === 'podcast') ||
              (categoryFilters.book && material.type === 'book')
            );
          })
          .map((material, index) => ({
            ...material,
            index: index + 1
          }))}
        viewType="materials"
        viewMode={listSubMode}
        onEdit={onEdit}
        onDelete={onDelete}
        onComplete={onComplete}
        onUpdateProgress={onUpdateProgress}
        unitMinutes={unitMinutes}
        onReorderItems={onReorderItems}
        onUnitMinutesChange={setUnitMinutes}
      />

      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        onSave={handleSaveProfile}
        initialName={userData?.name || ''}
        initialBio={userData?.bio || ''}
        initialTags={existingTags}
      />
    </div>
  );
};

// Helper function to get contribution color (same as ContributionGraph)
const getContributionColor = (count: number): string => {
  if (count === 0) return 'bg-[var(--materials-empty)]';
  if (count < 2) return 'bg-[var(--materials-l1)]';
  if (count < 5) return 'bg-[var(--materials-l2)]';
  if (count < 10) return 'bg-[var(--materials-l3)]';
  return 'bg-[var(--materials-l4)]';
};

export default ListLayout; 