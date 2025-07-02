
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import type { Model } from "./model-selector";
import { KnowledgeBaseDialog } from "./knowledge-base-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ChatHeaderProps {
  selectedModel: Model;
  setKnowledgeBase: (value: string) => void;
  isAgenticMode: boolean;
  setIsAgenticMode: (value: boolean) => void;
}

export function ChatHeader({
  selectedModel,
  setKnowledgeBase,
  isAgenticMode,
  setIsAgenticMode,
}: ChatHeaderProps) {
  return (
    <>
      <header className="relative flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="transition-opacity md:opacity-0 md:group-hover/sidebar-wrapper:opacity-100" />
          <h2 className="text-lg font-semibold">{selectedModel}</h2>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
           <Switch
            id="agentic-mode"
            checked={isAgenticMode}
            onCheckedChange={setIsAgenticMode}
          />
          <Label htmlFor="agentic-mode" className="text-sm font-medium">
            Agentic Mode
          </Label>
        </div>
        <div className="flex items-center gap-4">
          <KnowledgeBaseDialog onSave={setKnowledgeBase} />
        </div>
      </header>
    </>
  );
}
