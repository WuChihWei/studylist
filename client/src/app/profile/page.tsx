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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import { Plus } from "lucide-react"
import Link from "next/link"
import { MdWeb } from "react-icons/md"
import { FiVideo, FiBook } from "react-icons/fi"
import { HiOutlineMicrophone } from "react-icons/hi"
import AddNewMaterial from '../components/AddNewMaterial';
import { BsListUl, BsGrid } from "react-icons/bs"

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    topicId: string | null;
  }>({
    isOpen: false,
    topicId: null
  });

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 检测侧边栏状态
  useEffect(() => {
    const checkSidebarState = () => {
      const cookies = document.cookie.split(';');
      const sidebarCookie = cookies.find(cookie => cookie.trim().startsWith('sidebar_state='));
      if (sidebarCookie) {
        const sidebarState = sidebarCookie.split('=')[1];
        setSidebarCollapsed(sidebarState === 'false');
      }
    };

    checkSidebarState();
    
    // 监听 cookie 变化
    const handleStorageChange = () => {
      checkSidebarState();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 创建 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(() => {
      checkSidebarState();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-sidebar-collapsed']
    });
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  }, []);

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
          
        </div>
      </div>
    );
  };

  // const TopicHeader = ({ topic }) => {
  //   return (
  //     <div className={styles.topicHeaderContainer}>
  //       <div className={styles.topicMainInfo}>
  //         <h2 className={styles.topicTitle}>
  //           {/* {topic.name} */}
  //         </h2>
  //       </div>
  //     </div>
  //   );
  // };

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
        className={`${styles.topicTab} ${isActive ? styles.active : ''} whitespace-nowrap text-base`}
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
                  width={80}
                  height={80}
                  className={styles.avatar}
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
    <div className="flex h-screen w-full">
      <div className="flex w-full h-full" style={{ "--profile-sidebar-width": sidebarCollapsed ? "var(--sidebar-width-icon)" : "var(--sidebar-width)" } as React.CSSProperties}>
        {!isMobile ? (
          <Sidebar 
            activeView={activeView} 
            onViewChange={setActiveView} 
            className="border-r h-full flex-shrink-0"
            width={sidebarCollapsed ? "var(--sidebar-width-icon)" : "var(--sidebar-width)"}
          />
        ) : (
          <div className="fixed top-0 left-0 w-full z-10  border-b flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  // 在移动端打开侧边栏的逻辑
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              <span className="ml-2 font-semibold">DAVINCI</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setActiveView('materials')}>
                  Materials
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('studylist')}>
                  Study List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <div className={styles.profileContainer}>
          <div className="flex flex-col w-full min-h-screen px-20">
            <div className="flex-1">
              {/* 顶部导航栏 */}
              <div className="flex justify-between items-center py-10">
                <div className="flex items-center gap-2 w-1/2">
                  {/* 使用 AddNewMaterial 组件，宽度设为 100% */}
                  <AddNewMaterial onSubmit={(material) => {
                    if (activeTab) {
                      addMaterial({
                        title: material.title,
                        type: material.type,
                        url: material.url || undefined,
                        rating: 5,
                        dateAdded: new Date()
                      }, activeTab);
                    } else {
                      alert('Please select a topic first');
                    }
                  }} />
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Account 下拉选单 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Link href="/profile" className="w-full">
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <button onClick={handleEditProfile} className="w-full text-left">
                          Edit Profile
                        </button>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/login" className="w-full">
                          Log in
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/signup" className="w-full">
                          Sign up
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Profile Header Section */}
              <div className=" mt-4">
                <div className="flex flex-col md:flex-row w-full pb-6 rounded-lg shadow-sm">
                  <div className="w-full md:w-1/2 flex flex-col">
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start w-full">
                      <div className="w-20 flex flex-col mb-4 md:mb-0 md:mr-4">
                        <div className="relative w-full rounded-full overflow-hidden flex justify-center items-center">
                          <Image 
                            src={userData?.photoURL || '/default-avatar.png'}
                            alt={userData?.name || 'User'}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col justify-center text-center md:text-left">
                        <h4 className="font-bold">{userData?.name}</h4>
                        <p className="text-gray-800 max-w-xl text-base font-medium leading-normal">{userData?.bio || 'Introduce yourself'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/2 rounded-lg ">
                    <ContributionGraph 
                      data={getContributionData()}
                      activeView={activeView}
                    />
                  </div>
                </div>
              </div>

              {/* Topic Header Section */}
              <div className="border-b border-t pt-2 pb-2">
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="flex items-center mb-2 sm:mb-0">
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
                          className="w-full"
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

                  {/* Topic Tabs & Contributors */}
                  <div className="flex flex-col">
                    {/* Topic Tabs */}
                    <div className="flex items-center gap-0 overflow-x-auto pb-2 sm:pb-0">
                      {userData?.topics?.map((topic) => (
                        <TopicTab
                          key={topic._id}
                          topic={topic}
                          isActive={activeTab === topic._id}
                          onClick={() => handleTabClick(topic._id)}
                        />
                      ))}
                      <button onClick={handleAddTopic} className={styles.addTopicButton}>
                        +
                      </button>
                    </div>

                    {/* Contributors Section */}
                    <div className="flex justify-start sm:justify-end mt-2 sm:mt-0">
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
                </div>
              </div>

              {/* Content Section */}
              <div className="mt-4">
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
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      <EditProfileDialog 
        open={isEditing} 
        onOpenChange={setIsEditing}
        onSave={handleSaveProfile}
        initialName={userData?.name || ''}
        initialBio={userData?.bio || ''}
      />
    </div>
  );
}