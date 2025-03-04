import { ColumnDef } from "@tanstack/react-table"
import { Material } from "@/types/User"
import { Button } from "@/app/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { TYPE_ICONS } from "../MaterialsView"
import React from "react"
// import { NoteCard } from "../components/ui/NoteCard"

type TableMaterial = Material & {
  index: number;
}

export const createColumns = (
  setOpenMoreMenu: (id: string | null) => void,
  openMoreMenu: string | null,
  onDeleteMaterial: (id: string) => Promise<boolean>,
  MoreMenu: React.ComponentType<any>,
  onUpdateMaterial: (id: string, updates: Partial<Material>) => Promise<boolean>,
  notePopup: {
    isOpen: boolean;
    materialId: string;
    title: string;
    note: string;
  },
  setNotePopup: (popup: {
    isOpen: boolean;
    materialId: string;
    title: string;
    note: string;
  }) => void
): ColumnDef<TableMaterial>[] => [
  {
    accessorKey: "index",
    header: "No.",
    size: 30,
    cell: ({ row }) => {
      const index = row.getValue("index") as number
      return <div className="text-sm text-muted-foreground pl-2">{index}</div>
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    size: 30,
    cell: ({ row }) => {
      const type = row.getValue("type") as Material['type']
      const Icon = TYPE_ICONS[type]
      return (
        <div className="flex items-center pl-2">
          {Icon ? React.createElement(Icon, { size: 16, className: "text-primary" }) : null}
        </div>
      )
    },
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      const material = row.original;
      return (
        <div 
          className="font-medium text-left pl-2 cursor-pointer hover:text-primary"
          onClick={() => {
            setNotePopup({
              isOpen: true,
              materialId: material._id || '',
              title: material.title || '',
              note: material.note || ''
            });
          }}
        >
          {title}
        </div>
      );
    },
  },
  {
    id: "actions",
    size: 30,
    cell: ({ row }) => {
      const material = row.original
      return (
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="float-right"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMoreMenu(material._id || null);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {openMoreMenu === material._id && (
            <MoreMenu
              materialId={material._id || ''}
              title={material.title || 'Untitled'}
              type={material.type}
              onClose={() => setOpenMoreMenu(null)}
              onDelete={async () => {
                if (material._id) {
                  console.log('Delete triggered for:', material._id);
                  await onDeleteMaterial(material._id);
                }
              }}
            />
          )}
        </div>
      )
    },
  },
]