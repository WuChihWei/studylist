"use client";
import { useState, useEffect } from 'react';
import { useUserData } from '../../hooks/useUserData';
import { Material, Categories } from '../../types/User';
import styles from './profile.module.css';
import Image from 'next/image';
import { FaImage, FaEdit, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import ContributionGraph from '../components/ContributionGraph';

export default function ProfilePage() {
  const { userData, loading, updateProfile, addTopic, updateTopicName, addMaterial } = useUserData();
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
    router.push('/profile/edit');
  };

  const handleSaveProfile = async () => {
    console.log('Saving profile with:', { editedName, editedBio });
    const success = await updateProfile({ 
      name: editedName, 
      bio: editedBio 
    });
    
    console.log('Save result:', success);
    if (success) {
      setIsEditing(false);
      // 更新本地顯示
      if (userData) {
        setEditedName(userData.name || '');
        setEditedBio(userData.bio || 'Introduce yourself');
      }
    } else {
      alert('Failed to update profile. Please try again.');
    }
  };

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
              <div className={styles.materialPreview}>
                <div className={styles.iconContainer}>
                  <FaImage size={20} color="#666" />
                </div>
              </div>
              <span className={styles.materialName}>{material.title}</span>
              <button className={styles.moreButton}>⋮</button>
            </div>
          ))}
          
          <form onSubmit={handleSubmit} className={styles.addForm}>
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
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          
          <div className={styles.profileUser}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarArea}>
                <Image
                  src={userData?.photoURL || '/default-avatar.png'}
                  alt={userData?.name || 'Profile'}
                  fill
                  className={styles.avatar}
                  priority
                />
                <button 
                  onClick={() => router.push('/profile/edit')} 
                  className={styles.editButton}
                >
                  Edit
                </button>
              </div>
              
              <div className={styles.rightSection}>
                <span className={styles.profileLink}>
                  {userData?.name || userData?.name?.split(' ')[0] || 'user'}
                </span>
                <div className={styles.bio}>
                  {userData?.bio || 'No bio yet'}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.contributionSection}>
            <ContributionGraph />
          </div>

        </div>
      </div>

      <div className={styles.topicSection}>
        <div className={styles.topicHeader}>
          <h2>
            {editingTopicId === activeTab ? (
              <div className={styles.topicEditContainer}>
                <input
                  type="text"
                  value={editedTopicName}
                  onChange={(e) => setEditedTopicName(e.target.value)}
                  className={styles.topicEditInput}
                />
                <button
                  onClick={() => handleSaveTopicName(activeTab)}
                  className={`${styles.iconButton} ${styles.confirmButton}`}
                  aria-label="Confirm edit"
                >
                  <FaCheck />
                </button>
                <button
                  onClick={handleCancelEditTopic}
                  className={`${styles.iconButton} ${styles.cancelButton}`}
                  aria-label="Cancel edit"
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              userData?.topics?.find(t => t._id === activeTab)?.name
            )}
          </h2>
          <div className={styles.topicTabs}>
            {userData?.topics?.map(topic => (
              <div key={topic._id} className={styles.topicTabWrapper}>
                <button
                  className={`${styles.topicTab} ${activeTab === topic._id ? styles.active : ''}`}
                  onClick={() => setActiveTab(topic._id || '')}
                >
                  {topic.name}
                </button>
                <button
                  className={styles.editTopicButton}
                  onClick={() => handleEditTopic(topic._id || '', topic.name)}
                >
                  <FaEdit />
                </button>
              </div>
            ))}
            <button onClick={handleAddTopic} className={styles.addTopicButton}>
              <FaPlus />
            </button>
          </div>
        </div>
        
        {/* Materials Grid - Two Columns */}
        <div className={styles.materialsGrid}>
          <div className={styles.materialColumn} data-type="webpage">  
            🌐 Website
            <MaterialList type="webpage" />
          </div>
          <div className={styles.materialColumn} data-type="video">
            🎥 Video
            <MaterialList type="video" />
          </div>
          <div className={styles.materialColumn}>
            🎧 Podcast
            <MaterialList type="podcast" />
          </div>
          <div className={styles.materialColumn}>
            📚 Book
            <MaterialList type="book" />
          </div>
        </div>
      </div>
    </div>
  );
}