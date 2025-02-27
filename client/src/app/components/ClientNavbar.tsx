'use client';

import Navbar from './Navbar';
import { useUserData } from '../../hooks/useUserData';
import { usePathname } from 'next/navigation';

const ClientNavbar = () => {
  const { userData, addMaterial } = useUserData();
  const pathname = usePathname() || '/';
  
  // 從 userData 中獲取第一個 topic 作為預設值
  const activeTopicId = userData?.topics?.[0]?._id || '';
  
  console.log('ClientNavbar - userData:', userData);
  console.log('ClientNavbar - activeTopicId:', activeTopicId);

  const handleAddMaterial = async (material: any) => {
    console.log('handleAddMaterial - material:', material);
    console.log('handleAddMaterial - activeTopicId:', activeTopicId);
    
    if (!activeTopicId) {
      console.log('No activeTopicId found');
      alert('Please select a topic first');
      return;
    }
    const success = await addMaterial(material, activeTopicId);
    console.log('handleAddMaterial - success:', success);
    
    if (!success) {
      alert('Failed to add material. Please try again.');
    }
  };

  return <Navbar onAddMaterial={handleAddMaterial} activeTopicId={activeTopicId} />;
};

export default ClientNavbar;