
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SidebarGroupLabel, useSidebar } from "@/components/ui/sidebar";
import { Bot } from "lucide-react";

export type Model =
  | 'Gemini Flash'
  | 'DeepSeek R1'
  | 'DeepSeek V3'
  | 'Qwen'
  | 'Nvidia Nemotron 49B'
  | 'Llama 4 Maverick'
  | 'Mistral Small';
const models: Model[] = [
  'Gemini Flash',
  'DeepSeek R1',
  'DeepSeek V3',
  'Qwen',
  'Nvidia Nemotron 49B',
  'Llama 4 Maverick',
  'Mistral Small',
];

interface ModelSelectorProps {
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
}

export function ModelSelector({
  selectedModel,
  setSelectedModel,
}: ModelSelectorProps) {
  const { state } = useSidebar();

  if (state === "collapsed") {
    return (
      <div className="px-2 flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bot className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-48 overflow-y-auto">
            <DropdownMenuRadioGroup
              value={selectedModel}
              onValueChange={(value) => setSelectedModel(value as Model)}
            >
              {models.map((model) => (
                <DropdownMenuRadioItem key={model} value={model}>
                  {model}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <>
      <SidebarGroupLabel>Model</SidebarGroupLabel>
      <div className="px-2">
        <Select
          value={selectedModel}
          onValueChange={(value) => setSelectedModel(value as Model)}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {models.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
