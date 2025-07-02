"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";

interface KnowledgeBaseDialogProps {
  onSave: (knowledge: string) => void;
}

export function KnowledgeBaseDialog({ onSave }: KnowledgeBaseDialogProps) {
  const [knowledge, setKnowledge] = useState("");

  const handleSave = () => {
    onSave(knowledge);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Knowledge Base
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Knowledge Base</DialogTitle>
          <DialogDescription>
            Paste any text into the field below to provide context for the AI.
            The AI will use this information to answer your questions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="knowledge">Knowledge Base Content</Label>
            <Textarea
              id="knowledge"
              placeholder="Paste your knowledge base content here..."
              className="h-48"
              value={knowledge}
              onChange={(e) => setKnowledge(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" onClick={handleSave}>
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
