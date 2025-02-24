import React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface NoteCardProps {
  isOpen: boolean
  title: string
  note: string
  onClose: () => void
  onSave: (note: string) => Promise<void>
}

export function NoteCard({ isOpen, title, note, onClose, onSave }: NoteCardProps) {
  const [editedNote, setEditedNote] = React.useState(note)
  const [isSaving, setIsSaving] = React.useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(editedNote)
      onClose()
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add your notes here..."
            value={editedNote}
            onChange={(e) => setEditedNote(e.target.value)}
            className="min-h-[150px]"
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}