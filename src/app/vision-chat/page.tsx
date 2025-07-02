
'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Loader2, Camera, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { actAsAiAgent } from '@/ai/flows/act-as-ai-agent';
import { textToSpeech } from '@/ai/flows/text-to-speech';

export default function VisionChatPage() {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('');
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

  const captureFrame = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg');
      }
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Input Error',
        description: 'Please enter a prompt.',
      });
      return;
    }

    const frameDataUri = captureFrame();
    if (!frameDataUri) {
      toast({
        variant: 'destructive',
        title: 'Capture Error',
        description: 'Could not capture a frame from the camera.',
      });
      return;
    }

    setIsLoading(true);
    setResponse('');
    setAudioDataUri(null);

    try {
      // Get text response from AI
      const aiResult = await actAsAiAgent({
        userPrompt: prompt,
        attachmentDataUri: frameDataUri,
        model: 'googleai/gemini-2.0-flash', // Use a vision-capable model
      });
      setResponse(aiResult.response);
      
      // Get audio response from AI
      const ttsResult = await textToSpeech({ text: aiResult.response });
      setAudioDataUri(ttsResult.audioDataUri);

      toast({
        title: 'Success!',
        description: 'The AI has responded.',
      });
    } catch (error) {
      console.error('Error during AI interaction:', error);
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Interaction Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioDataUri && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audioDataUri]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/vision-chat" showModelSelector={false} />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="transition-opacity md:opacity-0 md:group-hover/sidebar-wrapper:opacity-100" />
              <div className="flex items-center gap-2">
                <Camera className="size-5 text-primary" />
                <h1 className="text-lg font-semibold">Vision Chat</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-10">
            <div className="max-w-4xl mx-auto grid gap-8">
              <Card className="w-full shadow-lg">
                <CardHeader>
                  <CardTitle>AI Vision Chat</CardTitle>
                  <CardDescription>
                    Show your camera to the AI and ask it a question.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted/50">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <canvas ref={canvasRef} className="hidden" />
                    {hasCameraPermission === false && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                           <Alert variant="destructive">
                              <Camera className="h-4 w-4" />
                              <AlertTitle>Camera Access Required</AlertTitle>
                              <AlertDescription>
                                Please allow camera access in your browser to use this feature.
                              </AlertDescription>
                           </Alert>
                       </div>
                    )}
                    {hasCameraPermission === null && (
                         <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="size-8 animate-spin text-muted-foreground" />
                         </div>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <Textarea
                      placeholder="e.g., 'What is this object?'"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isLoading || hasCameraPermission === false}
                      className="flex-1"
                      rows={2}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || hasCameraPermission === false || !prompt.trim()}
                      size="lg"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                      <span className="sr-only">Send Message</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {(isLoading || response) && (
                <Card className="w-full shadow-lg min-h-[150px]">
                  <CardHeader>
                    <CardTitle>AI Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="size-5 animate-spin" />
                        <p>The AI is thinking...</p>
                      </div>
                    ) : (
                      <>
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          {response}
                        </div>
                        {audioDataUri && (
                           <div className="mt-4">
                             <audio ref={audioRef} controls src={audioDataUri} className="w-full">
                               Your browser does not support the audio element.
                             </audio>
                           </div>
                        )}
                      </>
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
