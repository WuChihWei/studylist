import { ColumnDef } from "@tanstack/react-table"
import { Material } from "@/types/User"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { TYPE_ICONS } from "./MaterialsView"
import React from "react"

type TableMaterial = Material & {
  index: number;
}

export const columns: ColumnDef<TableMaterial>[] = [
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
      const title = row.getValue("title") as string
      return <span className="font-medium text-left pl-2">{title}</span>
    },
  },
  {
    id: "actions",
    size: 30,
    cell: ({ row }) => {
      const material = row.original
      return (
        <Button variant="ghost" size="icon" className="float-right">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )
    },
  },
]