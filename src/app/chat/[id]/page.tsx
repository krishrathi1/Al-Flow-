"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function ChatHistoryPage() {
  return (
    <div className="flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Chat history is disabled. Please start a new conversation from the
            main page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
