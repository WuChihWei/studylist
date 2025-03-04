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
  
  interface EditProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (name: string, bio: string) => void
    initialName: string
    initialBio: string
  }
  
  export function EditProfileDialog({ 
    open, 
    onOpenChange, 
    onSave, 
    initialName, 
    initialBio 
  }: EditProfileDialogProps) {
    const [name, setName] = useState(initialName)
    const [bio, setBio] = useState(initialBio)
  
    const handleSave = () => {
      onSave(name, bio)
      onOpenChange(false)
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