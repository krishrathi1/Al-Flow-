"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Sparkles, StickyNote } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Node } from "./chat-layout";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessagesProps {
  nodes: Node[];
  isLoading: boolean;
  isAgenticMode: boolean;
  positions: { [id: string]: { x: number; y: number } };
  setPositions: (newPositions: { [id: string]: { x: number; y: number } } | ((prevPositions: { [id: string]: { x: number; y: number } }) => { [id: string]: { x: number; y: number } })) => void;
  onUpdateNoteContent: (noteId: string, content: string) => void;
}

export function ChatMessages({ nodes, isLoading, isAgenticMode, positions, setPositions, onUpdateNoteContent }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  const [linePaths, setLinePaths] = useState<string[]>([]);
  const [dragInfo, setDragInfo] = useState<{
    nodeId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);
  const [agenticContainerHeight, setAgenticContainerHeight] = useState(0);
  const [loaderPosition, setLoaderPosition] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    if (!isAgenticMode && viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [nodes, isAgenticMode]);


  useLayoutEffect(() => {
    if (!isAgenticMode || !viewportRef.current) {
      setLinePaths([]);
      setAgenticContainerHeight(0);
      setLoaderPosition(null);
      return;
    };

    const container = viewportRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const newPaths: string[] = [];
    let maxContainerHeight = 40;
    let newLoaderPosition = null;

    nodes.forEach((node, i) => {
        const domNode = nodeRefs.current[node.id];
        const pos = positions[node.id];
        if (domNode && pos) {
            maxContainerHeight = Math.max(maxContainerHeight, 120 + pos.y + domNode.offsetHeight);
        }

        if (i === 0) return;

        const prevNode = nodes[i - 1];
        if (!prevNode) return;
        
        const prevDomNode = nodeRefs.current[prevNode.id];
        const currentDomNode = nodeRefs.current[node.id];
        const prevPos = positions[prevNode.id];
        const currentPos = positions[node.id];

        if (prevDomNode && currentDomNode && prevPos && currentPos) {
            const prevNodeBottom = 120 + prevPos.y + prevDomNode.offsetHeight;
            const currentNodeTop = 120 + currentPos.y;
            
            const startX = containerWidth / 2 + prevPos.x;
            const startY = prevNodeBottom;
            const endX = containerWidth / 2 + currentPos.x;
            const endY = currentNodeTop;
            
            const c1y = startY + (endY - startY) * 0.4;
            const c2y = startY + (endY - startY) * 0.6;
            newPaths.push(`M ${startX} ${startY} C ${startX} ${c1y}, ${endX} ${c2y}, ${endX} ${endY}`);
        }
    });

    const lastNode = nodes[nodes.length - 1];
    if (isLoading && lastNode) {
        const lastDomNode = nodeRefs.current[lastNode.id];
        const lastPos = positions[lastNode.id];
        if (lastDomNode && lastPos) {
            const lastNodeBottom = (120 + lastPos.y) + lastDomNode.offsetHeight;
            const loaderRelativeY = lastPos.y + lastDomNode.offsetHeight + 100;
            const loaderX = lastPos.x;
            newLoaderPosition = { x: loaderX, y: loaderRelativeY };
            const loaderTop = 120 + newLoaderPosition.y;
            
            const startX = containerWidth / 2 + lastPos.x;
            const endX = containerWidth / 2 + newLoaderPosition.x;
            
            const c1y = lastNodeBottom + (loaderTop - lastNodeBottom) * 0.4;
            const c2y = lastNodeBottom + (loaderTop - lastNodeBottom) * 0.6;
            newPaths.push(`M ${startX} ${lastNodeBottom} C ${startX} ${c1y}, ${endX} ${c2y}, ${endX} ${loaderTop}`);
            
            const loaderHeight = 80;
            maxContainerHeight = Math.max(maxContainerHeight, loaderTop + loaderHeight);
        }
    } else if (isLoading && nodes.length === 0) {
        newLoaderPosition = { x: 0, y: 0 };
        const loaderTop = 120 + newLoaderPosition.y;
        const loaderHeight = 80;
        maxContainerHeight = Math.max(maxContainerHeight, loaderTop + loaderHeight);
    }

    setLoaderPosition(newLoaderPosition);
    setLinePaths(newPaths);
    setAgenticContainerHeight(maxContainerHeight + 100);
  }, [positions, nodes, isAgenticMode, isLoading]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => {
    if (e.button !== 0 || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
    
    e.preventDefault();
    document.body.style.cursor = "grabbing";
    setDragInfo({
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: positions[nodeId]?.x || 0,
      initialY: positions[nodeId]?.y || 0,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragInfo) return;
    const dx = e.clientX - dragInfo.startX;
    const dy = e.clientY - dragInfo.startY;
    setPositions((prev) => ({
        ...prev,
        [dragInfo.nodeId]: {
            x: dragInfo.initialX + dx,
            y: dragInfo.initialY + dy,
        }
    }));
  };

  const handleMouseUp = () => {
    if (document.body) document.body.style.cursor = "default";
    setDragInfo(null);
  };

  useEffect(() => {
    if (dragInfo && isAgenticMode) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (document.body) {
        document.body.style.cursor = "default";
      }
    };
  }, [dragInfo, isAgenticMode, setPositions]);

  const renderAgenticMode = () => (
    <div className="relative w-full p-8" style={{ height: `${agenticContainerHeight}px` }}>
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
          {linePaths.map((path, index) => (
            <path
              key={`line-${index}`}
              d={path}
              stroke="hsl(var(--border))"
              strokeWidth="1.5"
              fill="none"
              className="transition-all duration-300 ease-in-out"
            />
          ))}
        </svg>

        <div className="relative">
          {nodes.map((node) => (
            <div
              key={node.id}
              ref={el => nodeRefs.current[node.id] = el}
              className="absolute w-auto max-w-sm animate-node-in"
              style={{
                top: `${120 + (positions[node.id]?.y || 0)}px`,
                left: `calc(50% + ${positions[node.id]?.x || 0}px)`,
                transform: 'translateX(-50%)',
                zIndex: dragInfo?.nodeId === node.id ? 10 : 1,
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
            >
                <div className={cn(
                    "rounded-2xl border border-border shadow-lg backdrop-blur-sm cursor-grab min-w-64 transition-shadow hover:shadow-2xl",
                    dragInfo && "cursor-grabbing",
                    node.type === 'note' ? "bg-yellow-400/10 border-yellow-600/50" : "bg-card/80"
                )}>
                    {node.type === 'user' && (
                        <div className="p-4 space-y-2">
                            <div className="text-xs font-semibold text-muted-foreground">User Input</div>
                            <div className="text-sm text-foreground break-words whitespace-pre-wrap">{node.content}</div>
                        </div>
                    )}
                    {node.type === 'assistant' && (
                        <div className="p-4 space-y-2">
                            <div className="text-xs font-semibold text-muted-foreground">{node.model || 'Assistant'}</div>
                            <div className="text-sm text-foreground break-words whitespace-pre-wrap">{node.content}</div>
                        </div>
                    )}
                    {node.type === 'note' && (
                       <div className="p-4 space-y-2">
                            <Textarea
                                value={node.content}
                                onChange={(e) => onUpdateNoteContent(node.id, e.target.value)}
                                placeholder="Type your note..."
                                className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-yellow-100 placeholder:text-yellow-200/50 resize-none"
                            />
                        </div>
                    )}

                    <div className={cn(
                        "flex items-center justify-between border-t px-4 py-2 text-xs",
                        node.type === 'note' ? "border-yellow-600/50 text-yellow-200/60" : "border-border/50 text-muted-foreground"
                    )}>
                        <div className="flex items-center gap-2">
                            {node.type === 'user' && (<><User className="size-4" /><span>User</span></>)}
                            {node.type === 'assistant' && (<><Bot className="size-4" /><span>Assistant</span></>)}
                            {node.type === 'note' && (<><StickyNote className="size-4" /><span>Note</span></>)}
                        </div>
                        <span>just now</span>
                    </div>
                </div>
            </div>
          ))}

          {isLoading && loaderPosition && (
              <div className="absolute w-auto max-w-sm animate-node-in" style={{ top: `${120 + loaderPosition.y}px`, left: `calc(50% + ${loaderPosition.x}px)`, transform: 'translateX(-50%)' }}>
                 <div className="rounded-2xl border border-border bg-card/80 shadow-lg backdrop-blur-sm w-80">
                    <div className="p-4 text-sm text-foreground">
                        <div className="flex items-center space-x-2">
                           <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                           <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                           <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/50 px-4 py-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Bot className="size-4" />
                            <span>Typing...</span>
                        </div>
                    </div>
                 </div>
              </div>
          )}
        </div>
    </div>
  );

  const renderStandardMode = () => (
    <div className="space-y-6">
      {nodes.filter(n => n.type !== 'note').map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex items-start gap-4 animate-in fade-in-20 slide-in-from-bottom-4 duration-300 ease-out",
            message.type === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.type === "assistant" && (
            <Avatar className="h-9 w-9 border-2 border-primary/50">
              <AvatarFallback className="bg-primary/20 text-primary">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
          <div
            className={cn(
              "max-w-prose rounded-xl p-3 text-sm shadow-md space-y-2 transition-all",
              message.type === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-card"
            )}
          >
            {message.content && <div className="whitespace-pre-wrap">{message.content}</div>}
          </div>
          {message.type === "user" && (
            <Avatar className="h-9 w-9 border-2 border-muted">
              <AvatarFallback className="bg-muted">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-start gap-4 justify-start">
          <Avatar className="h-9 w-9 border-2 border-primary/50">
            <AvatarFallback className="bg-primary/20 text-primary">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="max-w-md rounded-lg p-3 text-sm shadow-sm bg-card flex items-center space-x-2">
            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span>
            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span>
            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span>
          </div>
        </div>
      )}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full border-2 border-dashed border-primary/50 bg-primary/10 p-6 shadow-inner animate-in fade-in zoom-in-95 duration-500">
        <Sparkles className="size-12 text-primary" />
      </div>
      <h3 className="text-2xl font-semibold animate-in fade-in-0 slide-in-from-bottom-2 delay-150 duration-500">Welcome to AI Flow</h3>
      <p className="text-muted-foreground max-w-md animate-in fade-in-0 slide-in-from-bottom-2 delay-300 duration-500">
        Start a conversation or ask a question. Toggle Agentic Mode for a workflow view.
      </p>
    </div>
  );

  return (
    <ScrollArea className="flex-1 bg-background" ref={scrollAreaRef}>
      <div className="p-4 md:p-6" ref={viewportRef}>
        {nodes.length === 0 && !isLoading
          ? renderEmptyState()
          : isAgenticMode
          ? renderAgenticMode()
          : renderStandardMode()}
      </div>
    </ScrollArea>
  );
}
