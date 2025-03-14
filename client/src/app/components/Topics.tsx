import React from 'react';
import { useRouter } from 'next/navigation';
import { Topic, Material } from '@/types/User';
import PathView from '../database/PathView';
import ListLayout from '../database/ListLayout';
import { ViewMode } from '@/types/ViewMode';

interface TopicsProps {
  topics: Topic[];
  contributions?: { date: string; count: number }[];
  viewMode: ViewMode;
  unitMinutes: number;
  setUnitMinutes: (minutes: number) => void;
  listSubMode: 'list' | 'grid';
  setListSubMode: (mode: 'list' | 'grid') => void;
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
  userData?: any;
  refreshKey?: number;
}

export default function Topics({
  topics,
  contributions,
  viewMode,
  unitMinutes,
  setUnitMinutes,
  listSubMode,
  setListSubMode,
  categoryFilters,
  setCategoryFilters,
  userData,
  refreshKey = 0
}: TopicsProps) {
  const router = useRouter();

  // Convert topics to materials format for compatibility
  const topicsAsMaterials = topics?.map(topic => ({
    _id: topic._id,
    type: 'webpage' as const,
    isCompleted: false,
    title: topic.name,
    url: '',
    dateAdded: topic.createdAt || new Date().toISOString(),
    order: topic.order || 0,
    rating: 0,
    favicon: undefined,
    completedUnits: 0,
    readingTime: 0,
    completed: false
  })) as Material[];

  // Calculate total contribution minutes
  const totalContributionMins = contributions?.reduce(
    (total, item) => total + (item.count || 0),
    0
  ) || 0;

  const handleTopicChange = (id: string) => {
    router.push(`/database?topic=${id}&mode=${viewMode}`);
  };

  if (viewMode === 'path') {
    return (
      <PathView
        topic={{
          name: 'All Topics',
          materials: topicsAsMaterials,
          _id: 'all-topics',
          createdAt: new Date().toISOString(),
          order: 0
        }}
        materials={topicsAsMaterials}
        contributions={contributions}
        unitMinutes={unitMinutes}
        setUnitMinutes={setUnitMinutes}
        onUpdateProgress={async () => false}
        onComplete={async () => {}}
        onDelete={async () => false}
        onReorderItems={async () => {}}
        isAllTopics={true}
      />
    );
  }

  return (
    <ListLayout
      data={contributions || []}
      year={new Date().getFullYear()}
      userData={userData}
      onEditProfile={() => {}}
      totalContributions={totalContributionMins}
      contributions={contributions}
      materials={topicsAsMaterials}
      categoryFilters={categoryFilters}
      setCategoryFilters={setCategoryFilters}
      listSubMode={listSubMode}
      setListSubMode={setListSubMode}
      showAddNewMaterial={false}
      setShowAddNewMaterial={() => {}}
      topicId={'all-topics'}
      refreshKey={refreshKey}
      unitMinutes={unitMinutes}
      setUnitMinutes={setUnitMinutes}
      onUpdateProgress={async () => false}
      onComplete={async () => {}}
      onEdit={() => {}}
      onDelete={async () => false}
      onReorderItems={async () => {}}
      onTopicChange={handleTopicChange}
      onAddTopic={() => router.push('/database/add-topic')}
      currentTopic={{
        name: 'All Topics',
        materials: topicsAsMaterials,
        _id: 'all-topics',
        createdAt: new Date().toISOString(),
        order: 0
      }}
      isAllTopics={true}
    />
  );
} 