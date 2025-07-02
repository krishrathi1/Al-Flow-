
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  User,
  FileCode,
  Wand2,
  Volume2,
  Image,
  FileAudio,
  Search,
} from "lucide-react";
import { Logo } from "@/components/icons";
import { ModelSelector, type Model } from "./model-selector";

interface AppSidebarProps {
  selectedModel?: Model;
  setSelectedModel?: (model: Model) => void;
  showModelSelector?: boolean;
}

export function AppSidebar({ selectedModel, setSelectedModel, showModelSelector = false }: AppSidebarProps) {
  const { state, isMobile } = useSidebar();
  const pathname = usePathname();
  
  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 p-2 overflow-hidden">
              <Logo className="size-6 text-primary shrink-0" />
              <span className="text-lg font-semibold whitespace-nowrap transition-opacity duration-200 ease-in-out group-data-[collapsible=icon]:opacity-0">AI Flow</span>
            </div>
          </TooltipTrigger>
           <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
            <p>AI Flow</p>
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Features</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton isActive={pathname === '/'}>
                  <MessageSquare />
                  <span>Chat</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/web-search">
                <SidebarMenuButton isActive={pathname === '/web-search'}>
                  <Search />
                  <span>Web Search</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/image-generation">
                <SidebarMenuButton isActive={pathname === '/image-generation'}>
                  <Image />
                  <span>Image Generation</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/file-reader">
                <SidebarMenuButton isActive={pathname === '/file-reader'}>
                  <FileCode />
                  <span>File Reader</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/prompt-enhance">
                <SidebarMenuButton isActive={pathname === '/prompt-enhance'}>
                  <Wand2 />
                  <span>Prompt Enhance</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/ai-talk">
                <SidebarMenuButton isActive={pathname === '/ai-talk'}>
                  <Volume2 />
                  <span>AI Talk</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/text-to-audio">
                <SidebarMenuButton isActive={pathname === '/text-to-audio'}>
                  <FileAudio />
                  <span>Text to Audio</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {showModelSelector && selectedModel && setSelectedModel && (
          <SidebarGroup>
            <ModelSelector
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/account">
              <SidebarMenuButton isActive={pathname === '/account'}>
                <User />
                Account
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
