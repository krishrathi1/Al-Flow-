
'use client';

import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2, Undo2, Redo2, StickyNote, FilePlus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface AgenticModeControlsProps {
    onResetPositions: () => void;
    onClearWorkflow: () => void;
    onNewFlow: () => void;
    onAddNote: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export function AgenticModeControls({ 
    onResetPositions, 
    onClearWorkflow,
    onNewFlow,
    onAddNote,
    onUndo,
    onRedo,
    canUndo,
    canRedo
}: AgenticModeControlsProps) {
    return (
        <div className="flex items-center justify-center gap-2 border-t bg-card p-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={onUndo} disabled={!canUndo} className="h-9 w-9">
                        <Undo2 className="size-4" />
                        <span className="sr-only">Undo</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>Undo</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={onRedo} disabled={!canRedo} className="h-9 w-9">
                        <Redo2 className="size-4" />
                        <span className="sr-only">Redo</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>Redo</p>
                </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-2" />

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={onNewFlow} className="h-9 w-9">
                        <FilePlus className="size-4" />
                        <span className="sr-only">New Flow</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>New Flow</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={onAddNote} className="h-9 w-9">
                        <StickyNote className="size-4" />
                        <span className="sr-only">Add Note</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>Add Note</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={onResetPositions} className="h-9 w-9">
                        <RotateCcw className="size-4" />
                        <span className="sr-only">Reset Positions</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>Reset Positions</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                     <Button variant="destructive" size="icon" onClick={onClearWorkflow} className="h-9 w-9">
                        <Trash2 className="size-4" />
                        <span className="sr-only">Clear Workflow</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>Clear Workflow</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
