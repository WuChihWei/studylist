import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/app/components/ui/dialog"
  import { Button } from "@/app/components/ui/button"
  import { Input } from "@/app/components/ui/input"
  import { Textarea } from "@/app/components/ui/textarea"
  import { useState } from "react"
  import { X } from "lucide-react"
  
  interface EditProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (name: string, bio: string, tags: string[]) => void
    initialName: string
    initialBio: string
    initialTags: string[]
  }
  
  export function EditProfileDialog({ 
    open, 
    onOpenChange, 
    onSave, 
    initialName, 
    initialBio,
    initialTags = []
  }: EditProfileDialogProps) {
    const [name, setName] = useState(initialName)
    const [bio, setBio] = useState(initialBio)
    const [tags, setTags] = useState<string[]>(initialTags)
    const [newTag, setNewTag] = useState("")
  
    const handleSave = () => {
      onSave(name, bio, tags)
      onOpenChange(false)
    }

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && newTag.trim()) {
        e.preventDefault()
        if (!tags.includes(newTag.trim())) {
          setTags([...tags, newTag.trim()])
        }
        setNewTag("")
      }
    }

    const handleRemoveTag = (tagToRemove: string) => {
      setTags(tags.filter(tag => tag !== tagToRemove))
    }
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name">Name</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="bio">Bio</label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="tags">Expertise Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-700 flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type a tag and press Enter"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }