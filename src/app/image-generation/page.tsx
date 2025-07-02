
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/app-sidebar';
import { Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { generateTogetherImage } from '@/ai/flows/together-image';


export default function ImageGenerationPage() {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Prompt is empty',
        description: 'Please enter a prompt to generate an image.',
      });
      return;
    }
    
    setIsLoading(true);
    setGeneratedImage(null);
    setError(null);

    try {
      const result = await generateTogetherImage(prompt);
      setGeneratedImage(result.imageDataUri);
      toast({
        title: 'Image Generated!',
        description: 'Your image has been created successfully.',
      });
    } catch (error) {
      let errorMessage = 'An unknown error occurred.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('Image generation failed:', errorMessage);
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SidebarProvider>
      <AppSidebar activePath="/image-generation"/>
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="transition-opacity md:opacity-0 md:group-hover/sidebar-wrapper:opacity-100" />
              <div className="flex items-center gap-2">
                <ImageIcon className="size-5 text-primary" />
                <h1 className="text-lg font-semibold">Image Generation</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-10">
            <div className="max-w-4xl mx-auto grid gap-8">
              <Card className="w-full shadow-lg">
                <CardHeader>
                  <CardTitle>Generate an Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="e.g., 'A cinematic shot of a raccoon astronaut in a spaceship'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                    className="h-24"
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    size="lg"
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate Image
                  </Button>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading && (
                 <Card className="w-full shadow-lg min-h-[400px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <Loader2 className="size-8 animate-spin" />
                        <p>Generating your image...</p>
                        <p className="text-xs">This can take up to a minute.</p>
                    </div>
                 </Card>
              )}

              {generatedImage && (
                <Card className="w-full shadow-lg">
                    <CardHeader>
                        <CardTitle>Your Generated Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-square relative w-full overflow-hidden rounded-lg border bg-muted">
                           <Image
                             src={generatedImage}
                             alt={prompt}
                             fill
                             className="object-contain"
                             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                           />
                        </div>
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
