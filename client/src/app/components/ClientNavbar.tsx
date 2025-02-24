'use client';

import Navbar from './Navbar';
import { useUserData } from '../../hooks/useUserData';
import { usePathname } from 'next/navigation';

const ClientNavbar = () => {
  const { addMaterial } = useUserData();
  const pathname = usePathname() || '/';
  const paths = pathname.split('/');
  const topicId = paths[paths.length - 1];

  const handleAddMaterial = async (material: any) => {
    if (!topicId || topicId === 'profile') {
      alert('Please select a topic first');
      return;
    }
    const success = await addMaterial(material, topicId);
    if (!success) {
      alert('Failed to add material. Please try again.');
    }
  };

  return <Navbar onAddMaterial={handleAddMaterial} />;
};

export default ClientNavbar;