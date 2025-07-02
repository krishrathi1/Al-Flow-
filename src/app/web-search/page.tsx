
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/app-sidebar';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { webSearch } from '@/ai/flows/web-search-flow';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function WebSearchPage() {
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        variant: 'destructive',
        title: 'Query is empty',
        description: 'Please enter a search query.',
      });
      return;
    }
    
    setIsLoading(true);
    setResponse('');
    setError('');

    try {
      const result = await webSearch({ query });
      setResponse(result.response);
      toast({
        title: 'Search Complete!',
        description: 'The AI has synthesized an answer.',
      });
    } catch (err) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error('Web search failed:', errorMessage);
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar activePath="/web-search" showModelSelector={false} />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="transition-opacity md:opacity-0 md:group-hover/sidebar-wrapper:opacity-100" />
              <div className="flex items-center gap-2">
                <Search className="size-5 text-primary" />
                <h1 className="text-lg font-semibold">Web Search</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-10">
            <div className="max-w-4xl mx-auto grid gap-8">
              <Card className="w-full shadow-lg">
                <CardHeader>
                  <CardTitle>AI-Powered Web Search</CardTitle>
                  <CardDescription>
                    Ask a question, and the AI will search the web to find the best answer for you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="e.g., 'What are the latest advancements in AI?'"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={isLoading || !query.trim()}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Search
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {(isLoading || response) && (
                <Card className="w-full shadow-lg min-h-[250px]">
                    <CardHeader>
                        <CardTitle>Answer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center pt-10 gap-2 text-muted-foreground">
                                <Loader2 className="size-5 animate-spin" />
                                <p>Searching the web and synthesizing an answer...</p>
                            </div>
                        ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                {response}
                            </div>
                        )}
                    </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
