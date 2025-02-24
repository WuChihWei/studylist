import { Material } from '../../types/User';
import styles from './MaterialsView.module.css';
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ListItemProps {
  material: Material;
  index: number;
  categoryIcons: Record<string, React.ReactNode>;
  onEdit: (material: Material) => void;
  onDelete: (id: string) => void;
}

export const ListItem = ({ material, index, categoryIcons, onEdit, onDelete }: ListItemProps) => {
  return (
    <div className={styles.listItem}>
      <div className={styles.itemLeft}>
        <span className={styles.itemNumber}>{index}.</span>
        <span className={styles.itemIcon}>
          {categoryIcons[material.type]}
        </span>
        <span className={styles.itemTitle}>{material.title}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={styles.moreButton}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onEdit(material)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Note
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDelete(material._id || '')}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};