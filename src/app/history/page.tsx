"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";

export default function HistoryPage() {
  return (
    <SidebarProvider>
      <AppSidebar activePath="/history" />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle>History Disabled</CardTitle>
              <CardDescription>
                Conversation history has been disabled to improve performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Your chats are now session-based and will not be saved.
              </p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
