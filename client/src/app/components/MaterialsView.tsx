import React, { useState, useMemo, useEffect } from 'react';
import { Material, Categories } from '../../types/User';
import styles from './MaterialsView.module.css';
import { LuGlobe } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { MdWeb } from "react-icons/md";
import { BsGrid, BsListUl } from "react-icons/bs";
import { IoChevronDownSharp } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineEdit } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { auth } from '../firebase/firebaseConfig';
import { useUserData } from '../../hooks/useUserData';
import { IconType } from 'react-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Link, Pencil, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { createColumns } from "./columns"
import { NoteCard } from "./NoteCard"

interface MaterialsViewProps {
  categories: Categories;
  onAddMaterial: (material: any) => void;
  onDeleteMaterial: (materialId: string) => Promise<boolean>;
  onUpdateMaterial: (materialId: string, updates: Partial<Material>) => Promise<boolean>;
  activeTab: string;
}

export const TYPE_ICONS: Record<string, IconType> = {
  video: FiVideo,
  book: FiBook,
  podcast: HiOutlineMicrophone,
  webpage: LuGlobe
};

const truncateTitle = (title: string, maxLength: number = 40) => {
  if (!title) return '';
  return title.length <= maxLength ? title : `${title.slice(0, maxLength)}...`;
};

export default function MaterialsView({ categories, onAddMaterial, onDeleteMaterial, onUpdateMaterial, activeTab }: MaterialsViewProps) {
  const [activeView, setActiveView] = useState<'materials' | 'studylist'>('materials');
  const [activeCategory, setActiveCategory] = useState<'all' | 'webpage' | 'video' | 'podcast' | 'book'>('all');
  const [selectedType, setSelectedType] = useState<'webpage' | 'video' | 'podcast' | 'book'>('webpage');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [notePopup, setNotePopup] = useState<{
    isOpen: boolean;
    materialId: string;
    title: string;
    note: string;
  }>({
    isOpen: false,
    materialId: '',
    title: '',
    note: ''
  });

  const categoryIcons = {
    all: <span className={styles.categoryIcon}><BsGrid size={18} /></span>,
    webpage: <span className={styles.categoryIcon}><MdWeb size={18} /></span>,
    video: <span className={styles.categoryIcon}><FiVideo size={18} /></span>,
    podcast: <span className={styles.categoryIcon}><HiOutlineMicrophone size={16} /></span>,
    book: <span className={styles.categoryIcon}><FiBook size={18} /></span>
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') {
      return categories.webpage.length + 
             categories.video.length + 
             categories.podcast.length + 
             categories.book.length;
    }
    return categories[category as keyof Categories]?.length || 0;
  };

  const getAllMaterials = () => {
    if (activeCategory === 'all') {
      return [
        ...categories.webpage.map(m => ({ ...m, type: 'webpage' })),
        ...categories.video.map(m => ({ ...m, type: 'video' })),
        ...categories.podcast.map(m => ({ ...m, type: 'podcast' })),
        ...categories.book.map(m => ({ ...m, type: 'book' }))
      ];
    }
    return categories[activeCategory].map(m => ({ ...m, type: activeCategory }));
  };

  const data = useMemo(() => {
    return getAllMaterials().map((material, index) => ({
      ...material,
      index: index + 1,
      type: material.type as Material['type']
    }));
  }, [categories, activeCategory]);

  const MoreMenu = ({ 
    materialId, 
    title,
    type,
    onClose,
    onDelete
  }: { 
    materialId: string, 
    title: string,
    type: keyof Categories,
    onClose: () => void,
    onDelete: () => Promise<boolean>
  }) => {
    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        console.log('Deleting material:', { materialId, title, type });
        const success = await onDelete();
        if (success) {
          onClose();
        }
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    };

    return (
      <div className={styles.moreMenu}>
        <Button
          variant="ghost"
          size="sm"
          className={styles.moreMenuItem}
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={styles.moreMenuItem}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <IoClose className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const table = useReactTable({
    data,
    columns: useMemo(() => createColumns(
      setOpenMoreMenu, 
      openMoreMenu, 
      onDeleteMaterial, 
      MoreMenu,
      onUpdateMaterial,
      notePopup,
      setNotePopup
    ), [openMoreMenu, onDeleteMaterial, onUpdateMaterial, notePopup]),
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  // 點擊外部時關閉 MoreMenu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMoreMenu && !(event.target as Element).closest('.moreMenu')) {
        setOpenMoreMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMoreMenu]);

  const isOnline = () => {
    return typeof window !== 'undefined' && window.navigator.onLine;
  };

  const fetchUserData = async (currentUser: any) => {
    if (isLoading) return;
    
    try {
      setLoading(true);
      
      if (!isOnline()) {
        console.log('Offline - using cached data if available');
        const cacheKey = `userData_${currentUser.uid}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        
        if (cachedData) {
          const { data } = JSON.parse(cachedData);
          setUserData(data);
          return;
        }
        throw new Error('No cached data available and device is offline');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/users/${currentUser.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const cacheKey = `userData_${currentUser.uid}`;
      
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const ViewToggle = () => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setViewMode('list')}
        className={viewMode === 'list' ? 'bg-accent' : ''}
      >
        <BsListUl size={20} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setViewMode('grid')}
        className={viewMode === 'grid' ? 'bg-accent' : ''}
      >
        <BsGrid size={20} />
      </Button>
    </div>
  );

  const GridItem = ({ material, index, category }: { material: Material, index: number, category: Material['type'] }) => {
    const materialId = material._id;
    if (!materialId) return null;

    const handleMoreClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenMoreMenu(openMoreMenu === materialId ? null : materialId);
    };

    return (
      <div className={styles.gridListItem}>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="text-sm text-muted-foreground pl-2">{index}</div>
          <div className="flex items-center pl-2">
            {TYPE_ICONS[category] && React.createElement(TYPE_ICONS[category], { 
              size: 16, 
              className: "text-primary" 
            })}
          </div>
          <span className="font-medium text-left pl-2">{material.title}</span>
        </div>
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="float-right"
            onClick={handleMoreClick}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {openMoreMenu === materialId && (
            <MoreMenu
              materialId={materialId}
              title={material.title || 'Untitled'}
              type={category}
              onClose={() => setOpenMoreMenu(null)}
              onDelete={async () => {
                console.log('Deleting material:', materialId);
                return onDeleteMaterial(materialId);
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.materialsContainer}>
      <div className={styles.categoriesContainer}>
        <div className={styles.categoryTabs}>
          <button
            className={`${styles.categoryTab} ${activeCategory === 'all' ? styles.active : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            {categoryIcons.all}
            <span>All ({getCategoryCount('all')})</span>
          </button>
          <button
            className={`${styles.categoryTab} ${activeCategory === 'webpage' ? styles.active : ''}`}
            onClick={() => setActiveCategory('webpage')}
          >
            {categoryIcons.webpage}
            <span>Web ({getCategoryCount('webpage')})</span>
          </button>
          <button
            className={`${styles.categoryTab} ${activeCategory === 'video' ? styles.active : ''}`}
            onClick={() => setActiveCategory('video')}
          >
            {categoryIcons.video}
            <span>Video ({getCategoryCount('video')})</span>
          </button>
          <button
            className={`${styles.categoryTab} ${activeCategory === 'podcast' ? styles.active : ''}`}
            onClick={() => setActiveCategory('podcast')}
          >
            {categoryIcons.podcast}
            <span>Podcast ({getCategoryCount('podcast')})</span>
          </button>
          <button
            className={`${styles.categoryTab} ${activeCategory === 'book' ? styles.active : ''}`}
            onClick={() => setActiveCategory('book')}
          >
            {categoryIcons.book}
            <span>Book ({getCategoryCount('book')})</span>
          </button>
        </div>
        <div className={styles.viewToggle}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? styles.activeView : ''}
          >
            <BsListUl size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? styles.activeView : ''}
          >
            <BsGrid size={18} />
          </Button>
        </div>
      </div>

      <div className={styles.materialsList}>
        {viewMode === 'list' ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="p-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="p-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell 
                      colSpan={table.getAllColumns().length} 
                      className="h-24 text-center"
                    >
                      No materials found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className={styles.gridView}>
            {(['webpage', 'video', 'podcast', 'book'] as const).map((category) => (
              <div key={category} className={styles.gridSection}>
                <div className={styles.gridSectionHeader}>
                  <div className="flex items-center gap-2">
                    {React.createElement(TYPE_ICONS[category], { 
                      size: 16,
                      className: "text-primary"
                    })}
                    <h5 className="font-medium capitalize">{category}</h5>
                    <span className="text-sm text-muted-foreground">
                      ({categories[category]?.length || 0})
                    </span>
                  </div>
                </div>
                
                <Card className={`overflow-hidden ${styles.gridCard}`}>
                  <CardContent className={`p-4 ${styles.gridCardContent}`}>
                    <div className={`space-y-2 ${styles.gridCardList}`}>
                      {(categories[category] || []).length > 0 ? (
                        (categories[category] || []).map((material, index) => (
                          <GridItem key={material._id} material={material} index={index + 1} category={category} />
                        ))
                      ) : (
                        <div className={styles.emptyState}>
                          No materials
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.addFormContainer}>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          onAddMaterial({
            title: formData.get('title'),
            type: selectedType,
            url: formData.get('url'),
            rating: 5
          });
          setShowUrlInput(false);
          (e.target as HTMLFormElement).reset();
        }} className={styles.addForm}>
          <div className={styles.addMaterialRow}>
            <Button type="submit" variant="ghost" size="icon" className={styles.centerIcon}>
              <Plus className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={styles.centerIcon}>
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

            <div className={styles.inputGroup}>
              <Input
                type="text"
                name="title"
                placeholder="Add Material..."
                required
                className={styles.centerText}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowUrlInput(prev => !prev)}
                className={`${styles.centerIcon} ${showUrlInput ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Link className="h-4 w-4" />
              </Button>
              
              {showUrlInput && (
                <Input
                  type="url"
                  name="url"
                  placeholder="Url(Optional)"
                  className={`mt-2 ${styles.centerText}`}
                />
              )}
            </div>
          </div>
        </form>
      </div>

      <NoteCard
        isOpen={notePopup.isOpen}
        title={notePopup.title}
        note={notePopup.note}
        onClose={() => setNotePopup(prev => ({ ...prev, isOpen: false }))}
        onSave={async (note) => {
          await onUpdateMaterial(notePopup.materialId, { note });
        }}
      />
    </div>
  );
}
