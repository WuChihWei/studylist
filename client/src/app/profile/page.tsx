"use client";
import { useState, useEffect } from 'react';
import { useUserData } from '../../hooks/useUserData';
import { Material, Categories } from '../../types/User';
import styles from './profile.module.css';
import Image from 'next/image';
import { FaImage, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import ContributionGraph from '../components/ContributionGraph';
import { MdEdit } from "react-icons/md";
import MaterialsView from '../components/MaterialsView';
import StudyListView from '../components/StudyListView';
import { auth } from '../firebase/firebaseConfig';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Sidebar } from "@/app/components/ui/sidebar"
import { Button } from "@/app/components/ui/button"
import { EditProfileDialog } from "../components/EditProfileDialog"
import { Input } from "@/app/components/ui/input"

export default function ProfilePage() {
  const { userData, loading, updateProfile, addTopic, updateTopicName, addMaterial, getContributionData, completeMaterial, uncompleteMaterial, fetchUserData, deleteMaterial, deleteTopic, updateMaterialProgress } = useUserData();
  const [activeTab, setActiveTab] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editedTopicName, setEditedTopicName] = useState('');
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: '',
    url: '',
    rating: 5
  });
  const router = useRouter();
  const [activeView, setActiveView] = useState<'materials' | 'studylist'>('materials');
  const [activeCategory, setActiveCategory] = useState<'all' | 'webpage' | 'video' | 'podcast' | 'book'>('all');
  const [unitMinutes, setUnitMinutes] = useState(20);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    topicId: string | null;
  }>({
    isOpen: false,
    topicId: null
  });

  // 在組件加載後設置第一個 topic 的 ID 作為 activeTab
  useEffect(() => {
    if (userData && userData.topics && userData.topics.length > 0) {
      const firstTopicId = userData.topics[0]._id;
      if (firstTopicId) {
        setActiveTab(firstTopicId);
      }
    }
  }, [userData]);

  useEffect(() => {
    if (userData) {
      setEditedName(userData.name || '');
      setEditedBio(userData.bio || 'Introduce yourself');
    }
  }, [userData]);

  // 處理個人資料編輯
  const handleEditProfile = () => {
    setEditedName(userData?.name || '')
    setEditedBio(userData?.bio || '')
    setIsEditing(true)
  }

  const handleSaveProfile = async (name: string, bio: string) => {
    try {
      await updateProfile({ name, bio })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  // 處理Topic編輯
  const handleEditTopic = (topicId: string, currentName: string) => {
    setEditingTopicId(topicId);
    setEditedTopicName(currentName);
  };

  const handleSaveTopicName = async (topicId: string) => {
    if (await updateTopicName(topicId, editedTopicName)) {
      setEditingTopicId(null);
    }
  };

  // 處理新增Topic
  const handleAddTopic = async () => {
    try {
      const newTopicName = `Topic ${(userData?.topics?.length || 0) + 1}`;
      const success = await addTopic(newTopicName);
      
      if (!success) {
        console.error('Failed to add topic');
        // 可以在這裡添加一些用戶提示，比如 toast 通知
      }
    } catch (error) {
      console.error('Error adding topic:', error);
    }
  };

  // 新增取消編輯功能
  const handleCancelEditTopic = () => {
    setEditingTopicId(null);
    setEditedTopicName('');
  };

  const handleDeleteTopic = (topicId: string) => {
    setDeleteConfirmation({
      isOpen: true,
      topicId
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.topicId || !userData) return;

    try {
      const success = await deleteTopic(deleteConfirmation.topicId);
      
      if (success) {
        // If we're deleting the active topic, switch to the first available topic
        if (activeTab === deleteConfirmation.topicId && userData.topics?.length > 1) {
          const nextTopic = userData.topics.find(t => t._id !== deleteConfirmation.topicId);
          if (nextTopic?._id) {
            setActiveTab(nextTopic._id);
          }
        }
      } else {
        alert('Failed to delete topic. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic. Please try again.');
    } finally {
      setDeleteConfirmation({ isOpen: false, topicId: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, topicId: null });
  };

  const handleAddMaterial = async (material: any) => {
    if (!material.title?.trim()) {
      alert('Please enter a title');
      return;
    }

    const success = await addMaterial({
      title: material.title.trim(),
      type: material.type,
      url: material.url?.trim(),
      rating: material.rating,
      dateAdded: new Date()
    }, activeTab);

    if (!success) {
      alert('Failed to add material. Please try again.');
    }
  };

  const handleTabClick = (topicId: string | undefined) => {
    if (topicId) {
      setActiveTab(topicId);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!userData) return <div>Please log in</div>;
  

  const MaterialList = ({ type }: { type: keyof Categories }) => {
    const currentTopic = userData?.topics?.find(t => t._id === activeTab);
    
    if (!currentTopic) {
      return <div>Please select a topic</div>;
    }

    const materialsForType = currentTopic.categories[type] || [];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      const title = formData.get('title') as string;
      const url = formData.get('url') as string;

      if (!title.trim()) {
        alert('Please enter a title');
        return;
      }

      const success = await addMaterial({
        title: title.trim(),
        type: type,
        url: url?.trim(),
        rating: 5,
        dateAdded: new Date()
      }, activeTab);

      if (success) {
        form.reset(); // 清空表單
      } else {
        alert('Failed to add material. Please try again.');
      }
    };

    return (
      <div className={styles.materialSection}>
        <div className={styles.materialHeader}></div>
        <div className={styles.materialItems}>
          {materialsForType.map((material, index) => (
            <div key={index} className={styles.materialRow}>
              <span className={styles.materialNumber}>{index + 1}</span>
              <span className={styles.materialName}>{material.title}</span>
              <button className={styles.moreButton}>⋮</button>
            </div>
          ))}
          
          {/* <form onSubmit={handleSubmit} className={styles.addForm}>
            <div className={styles.inputGroup}>
              <div className={styles.nameGroup}>
                <input
                  type="text"
                  name="title"
                  placeholder={`Add New ${type}...`}
                  required
                  className={styles.addInput}
                />
                <input
                  type="url"
                  name="url"
                  placeholder="url..."
                  className={styles.urlInput}
                />
              </div>
              <div>
                <button type="submit" className={styles.uploadButton}>
                  +
                </button>
              </div>
            </div>
          </form> */}
        </div>
      </div>
    );
  };

  const TopicHeader = ({ topic }) => {
    return (
      <div className={styles.topicHeaderContainer}>
        <div className={styles.topicMainInfo}>
          <h2 className={styles.topicTitle}>
            {/* {topic.name} */}
          </h2>
        </div>
      </div>
    );
  };

  // 定義 TopicTab 組件
  interface TopicTabProps {
    topic: {
      _id?: string;
      name: string;
    };
    isActive: boolean;
    onClick: () => void;
  }

  const TopicTab = ({ topic, isActive, onClick }: TopicTabProps) => {
    return (
      <div 
        className={`${styles.topicTab} ${isActive ? styles.active : ''}`}
        onClick={onClick}
      >
        <div className={styles.tabContent}>
          <span className={styles.tabName}>{topic.name}</span>
        </div>
      </div>
    );
  };

  const TopicLayout = () => {
    return (
      <div className={styles.rightSection}>
        <div className={styles.topicHeaderContainer}>
          <div className={styles.topicTabs}>
            {userData?.topics?.map((topic) => (
              <TopicTab
                key={topic._id}
                topic={topic}
                isActive={activeTab === topic._id}
                onClick={() => handleTabClick(topic._id)}
              />
            ))}
            <button onClick={handleAddTopic} className={styles.addTopicButton}>
              <FaPlus />
            </button>
          </div>
        </div>

        <div className={styles.members}>
          {(() => {
            const currentTopic = userData?.topics?.find(t => t._id === activeTab);
            const participants = currentTopic?.participants;

            if (participants && participants.length > 0) {
              return participants.map((participant, index) => (
                <div key={index} className={styles.memberWrapper}>
                  <Image 
                    src={participant.photoURL || '/default-avatar.png'}
                    alt={participant.name}
                    width={20}
                    height={20}
                    className={styles.memberAvatar}
                  />
                  <span className={styles.memberTooltip}>{participant.name}</span>
                </div>
              ));
            }
            
            return (
              <div className={styles.memberWrapper}>
                <Image 
                  src={userData?.photoURL || '/default-avatar.png'}
                  alt={userData?.name || 'User'}
                  width={20}
                  height={20}
                  className={styles.memberAvatar}
                />
                <span className={styles.memberTooltip}>{userData?.name || 'User'}</span>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        className="border-r"
      />
      
      <div className="flex-1 p-14 flex flex-col gap-2">
        {/* Profile Header Section */}
        <div className="">
          <div className={styles.profileInfo}>
            <div className={styles.profileUser}>
              <div className={styles.avatarSection}>
                <div className={styles.leftSection}>
                  <div className={styles.avatarArea}>
                    <Image 
                      src={userData?.photoURL || '/default-avatar.png'}
                      alt={userData?.name || 'User'}
                      width={120}
                      height={120}
                      className={styles.avatar}
                    />
                  </div>
                  <div>
                  <Button variant="outline" onClick={handleEditProfile} className={styles.editButton}>
                    Edit
                  </Button>
                  </div>
                </div>
                <div className={styles.rightSection}>
                  <h4 className="">{userData?.name}</h4>
                  <p className={styles.bio}>{userData?.bio || 'Introduce yourself'}</p>
                </div>
              </div>
            </div>
            
            <div className={styles.contributionSection}>
              <ContributionGraph 
                data={getContributionData()}
                activeView={activeView}
              />
            </div>
          </div>
        </div>

        {/* Topic Header Section */}
        <div className=" border-b border-t pt-2 pb-2">
          <div className="flex justify-between">
            <div className="flex items-center">
              {editingTopicId === activeTab ? (
                <div className={styles.topicEditContainer}>
                  <Button size="sm" onClick={() => handleSaveTopicName(activeTab)}>
                    <FaCheck className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEditTopic}>
                    <FaTimes className="h-4 w-4" />
                  </Button>
                  <Input
                    value={editedTopicName}
                    onChange={(e) => setEditedTopicName(e.target.value)}
                    className="w-[200px]"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="">
                    {userData?.topics.find(t => t._id === activeTab)?.name}
                  </h1>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditTopic(activeTab, userData?.topics.find(t => t._id === activeTab)?.name || '')}
                  >
                    <MdEdit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Left Column - Topic Tabs & Contributors */}
            <div className="flex flex-col">
              {/* Topic Tabs */}
              <div className="flex items-center gap-0">
                {userData?.topics?.map((topic) => (
                  <TopicTab
                    key={topic._id}
                    topic={topic}
                    isActive={activeTab === topic._id}
                    onClick={() => handleTabClick(topic._id)}
                  />
                ))}
                <button onClick={handleAddTopic} className={styles.addTopicButton}>
                  {/* <FaPlus /> */}
                  +
                </button>
              </div>

              {/* Contributors Section */}
              <div className="flex justify-end">
                <div className="flex">
                  {userData?.topics.find(t => t._id === activeTab)?.contributors?.map((contributor, index) => (
                    <Image
                      key={contributor.id}
                      src={contributor.photoURL || '/default-avatar.png'}
                      alt={contributor.name}
                      width={32}
                      height={32}
                      className="rounded-full border-2 border-white"
                    />
                  )) || (
                    <Image
                      src={userData?.photoURL || '/default-avatar.png'}
                      alt={userData?.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full border-2 border-white"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Active Topic Title */}
            
          </div>
        </div>

        {/* Content Section */}
        <div className="">
          {activeView === 'materials' ? (
            <MaterialsView 
              categories={userData?.topics.find(t => t._id?.toString() === activeTab)?.categories || {
                webpage: [],
                video: [],
                podcast: [],
                book: []
              }}
              onAddMaterial={(material) => addMaterial(material, activeTab)}
              onDeleteMaterial={async (materialId) => {
                try {
                  const success = await deleteMaterial(materialId, activeTab);
                  if (!success) throw new Error('Failed to delete material');
                  return true;
                } catch (error) {
                  console.error('Error deleting material:', error);
                  return false;
                }
              }}
              onUpdateMaterial={async (materialId, updates) => {
                try {
                  const user = auth.currentUser;
                  if (!user) throw new Error('No user logged in');
                  
                  if (updates.completed) {
                    await completeMaterial(materialId, activeTab);
                  } else {
                    await updateMaterialProgress(materialId, activeTab, {
                      completedUnits: updates.completedUnits as number,
                      completed: updates.completed as boolean,
                      readingTime: updates.readingTime as number
                    });
                  }
                  
                  await fetchUserData(user);
                  return true;
                } catch (error) {
                  console.error('Error in onUpdateMaterial:', error);
                  return false;
                }
              }}
              activeTab={activeTab}
            />
          ) : (
            <StudyListView 
              categories={userData?.topics.find(t => t._id === activeTab)?.categories || {
                webpage: [],
                video: [],
                podcast: [],
                book: []
              }}
              onCompleteMaterial={async (materialId, isCompleted) => {
                if (isCompleted) {
                  await uncompleteMaterial(materialId, activeTab);
                } else {
                  await completeMaterial(materialId, activeTab);
                }
              }}
              unitMinutes={unitMinutes}
              onUnitMinutesChange={setUnitMinutes}
              topicId={activeTab}
              onUpdateMaterial={async (materialId, updates) => {
                try {
                  const user = auth.currentUser;
                  if (!user) throw new Error('No user logged in');
                  
                  if (updates.completed) {
                    await completeMaterial(materialId, activeTab);
                  } else {
                    await updateMaterialProgress(materialId, activeTab, {
                      completedUnits: updates.completedUnits as number,
                      completed: updates.completed as boolean,
                      readingTime: updates.readingTime as number
                    });
                  }
                  
                  await fetchUserData(user);
                  return true;
                } catch (error) {
                  console.error('Error in onUpdateMaterial:', error);
                  return false;
                }
              }}
            />
          )}
        </div>
      </div>
      <EditProfileDialog
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleSaveProfile}
        initialName={userData?.name || ''}
        initialBio={userData?.bio || ''}
      />
    </div>
  );
}