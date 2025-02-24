"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "../../components/ui/navigation-menu"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu"
import { Plus, Link as LinkIcon } from "lucide-react"
import { MdWeb } from "react-icons/md"
import { FiVideo, FiBook } from "react-icons/fi"
import { HiOutlineMicrophone } from "react-icons/hi"
import styles from './Navbar.module.css'
import { usePathname } from 'next/navigation'

interface NavbarProps {
  onAddMaterial?: (material: {
    title: string;
    type: string;
    url: string | null;
    rating: number;
  }) => void;
}

const Navbar = ({ onAddMaterial }: NavbarProps) => {
  const [selectedType, setSelectedType] = useState('webpage')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const pathname = usePathname()

  const categoryIcons = {
    webpage: <MdWeb size={18} />,
    video: <FiVideo size={18} />,
    podcast: <HiOutlineMicrophone size={18} />,
    book: <FiBook size={18} />
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onAddMaterial) return;
    
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title')?.toString() || '';
    const url = formData.get('url')?.toString() || null;
    
    onAddMaterial({
      title,
      type: selectedType,
      url,
      rating: 5
    });
    setShowUrlInput(false);
    (e.target as HTMLFormElement).reset();
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
          <form onSubmit={handleSubmit} className={styles.addForm}>
            <div className={styles.addMaterialRow}>
              <Button type="submit" variant="ghost" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {categoryIcons[selectedType]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setSelectedType('webpage')}>
                    <MdWeb size={18} className="mr-2" />
                    <span>Webpage</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setSelectedType('video')}>
                    <FiVideo size={18} className="mr-2" />
                    <span>Video</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setSelectedType('podcast')}>
                    <HiOutlineMicrophone size={18} className="mr-2" />
                    <span>Podcast</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setSelectedType('book')}>
                    <FiBook size={18} className="mr-2" />
                    <span>Book</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className={styles.inputContainer}>
                <Input
                  type="text"
                  name="title"
                  placeholder="Add Material..."
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUrlInput(prev => !prev)}
                  className={showUrlInput ? 'text-primary' : 'text-muted-foreground'}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
                {showUrlInput && (
                  <div className={styles.urlInputOverlay}>
                    <Input
                      type="url"
                      name="url"
                      placeholder="Url(Optional)"
                      className={styles.urlInput}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
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
              <Link href="/profile" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  My Profile
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/login" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Login
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/signup" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Signup
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  )
}

export default Navbar 