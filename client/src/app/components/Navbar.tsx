"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "./ui/navigation-menu"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Plus, Link as LinkIcon, Search } from "lucide-react"
import { MdWeb } from "react-icons/md"
import { FiVideo, FiBook } from "react-icons/fi"
import { HiOutlineMicrophone } from "react-icons/hi"
import styles from './Navbar.module.css'
import { usePathname } from 'next/navigation'
import { useUserData } from '../../hooks/useUserData'
import AddNewMaterial from './AddNewMaterial'

interface NavbarProps {
  onAddMaterial?: (material: {
    title: string;
    type: string;
    url: string | null;
    rating: number;
  }) => void;
  activeTopicId?: string;
}

const Navbar = ({ onAddMaterial: externalAddMaterial, activeTopicId: externalTopicId }: NavbarProps) => {
  const pathname = usePathname() || '/'
  
  // 整合 ClientNavbar 的功能
  const { userData, addMaterial } = useUserData();
  
  // 使用外部提供的 activeTopicId 或從 userData 中獲取第一個 topic 作為預設值
  const activeTopicId = externalTopicId || userData?.topics?.[0]?._id || '';
  
  console.log('Navbar - userData:', userData);
  console.log('Navbar - activeTopicId:', activeTopicId);

  const handleAddMaterial = async (material: any) => {
    console.log('🚀 Navbar.handleAddMaterial - 開始執行', material);
    console.log('🚀 Navbar.handleAddMaterial - activeTopicId:', activeTopicId);
    
    if (!activeTopicId) {
      console.log('🚀 Navbar.handleAddMaterial - 沒有找到 activeTopicId');
      alert('Please select a topic first');
      return;
    }
    
    // 使用外部提供的 onAddMaterial 或內部的 addMaterial
    if (externalAddMaterial) {
      console.log('🚀 Navbar.handleAddMaterial - 使用外部提供的 onAddMaterial');
      externalAddMaterial(material);
    } else {
      console.log('🚀 Navbar.handleAddMaterial - 使用內部的 addMaterial');
      try {
        const materialWithOrder = {
          ...material,
          order: 0 // 設置默認 order
        };
        console.log('🚀 Navbar.handleAddMaterial - 準備添加材料:', materialWithOrder);
        const success = await addMaterial(materialWithOrder, activeTopicId);
        console.log('🚀 Navbar.handleAddMaterial - 添加結果:', success);
        
        if (!success) {
          console.log('🚀 Navbar.handleAddMaterial - 添加失敗');
          alert('Failed to add material. Please try again.');
        } else {
          console.log('🚀 Navbar.handleAddMaterial - 添加成功');
        }
      } catch (error) {
        console.error('🚀 Navbar.handleAddMaterial - 錯誤:', error);
        alert('An error occurred while adding material.');
      }
    }
  };

  const handleAddNewMaterial = (materialData: { title: string; type: string; url: string | null }) => {
    console.log('🚀 Navbar.handleAddNewMaterial - 開始執行', materialData);
    handleAddMaterial({
      ...materialData,
      rating: 5
    });
    console.log('🚀 Navbar.handleAddNewMaterial - 調用 handleAddMaterial 完成');
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">
          <h1>DAVINCI</h1>
          {/* <span>da Vinci to nth power</span> */}
        </Link>
      </div>

      {pathname === '/profile' && (
        <div className={styles.centerSection}>
          <AddNewMaterial onSubmit={handleAddNewMaterial} />
        </div>
      )}

      <div className={styles.actions}>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuTrigger>Account</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className={styles.dropdownContent}>
                  <Link href="/profile" className={styles.dropdownItem}>
                    My Profile
                  </Link>
                  <Link href="/login" className={styles.dropdownItem}>
                    Log in
                  </Link>
                  <Link href="/signup" className={styles.dropdownItem}>
                    Sign up
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  )
}

export default Navbar