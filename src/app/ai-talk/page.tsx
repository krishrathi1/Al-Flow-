
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
import { Loader2, Mic, MicOff, Volume2, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { actAsAiAgent } from '@/ai/flows/act-as-ai-agent';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Check for SpeechRecognition API
const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

interface ConversationMessage {
  speaker: 'user' | 'ai';
  text: string;
}

export default function AiTalkPage() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isProcessingRef = useRef(isProcessing);
  const isListeningRef = useRef(isListening);
  const { toast } = useToast();
  
  useEffect(() => {
    isProcessingRef.current = isProcessing;
    isListeningRef.current = isListening;
  }, [isProcessing, isListening]);

  useEffect(() => {
    const getMicPermission = async () => {
      if (!SpeechRecognition) {
        toast({
          variant: 'destructive',
          title: 'Browser Not Supported',
          description: 'Your browser does not support the Web Speech API.',
        });
        setHasMicPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasMicPermission(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setHasMicPermission(false);
        toast({
          variant: 'destructive',
          title: 'Microphone Access Denied',
          description: 'Please enable microphone permissions in your browser settings.',
        });
      }
    };
    getMicPermission();
  }, [toast]);

  const handleUserSpeech = useCallback(async (transcript: string) => {
    setConversation((prev) => [...prev, { speaker: 'user', text: transcript }]);
    setIsProcessing(true);
    setAudioDataUri(null);

    try {
      const aiResult = await actAsAiAgent({
        userPrompt: transcript,
        model: 'googleai/gemini-2.0-flash',
      });
      const aiResponseText = aiResult.response;

      if (!aiResponseText?.trim()) {
        toast({ title: 'AI gave an empty response.' });
        return;
      }

      const ttsResult = await textToSpeech({ text: aiResponseText });
      
      setConversation((prev) => [...prev, { speaker: 'ai', text: aiResponseText }]);
      setAudioDataUri(ttsResult.audioDataUri);

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
      setIsProcessing(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!hasMicPermission || !SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim();
        if (transcript && !isProcessingRef.current) {
          handleUserSpeech(transcript);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast({
        variant: 'destructive',
        title: 'Speech Recognition Error',
        description: `An error occurred: ${event.error}`,
      });
      if (isListeningRef.current) {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch(e) {
          console.error("Recognition could not be restarted.", e);
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, [hasMicPermission, toast, handleUserSpeech]);

  const toggleListening = () => {
    const shouldBeListening = !isListening;
    
    // Immediately update the ref to prevent race condition with onend handler
    isListeningRef.current = shouldBeListening;
    setIsListening(shouldBeListening);

    if (shouldBeListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Error starting recognition:", e);
          isListeningRef.current = false; // Revert ref
          setIsListening(false);      // Revert state
        }
      }
    } else {
      recognitionRef.current?.stop();
    }
  };

  useEffect(() => {
    if (audioDataUri && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audioDataUri]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/ai-talk" showModelSelector={false} />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="transition-opacity md:opacity-0 md:group-hover/sidebar-wrapper:opacity-100" />
              <div className="flex items-center gap-2">
                <Volume2 className="size-5 text-primary" />
                <h1 className="text-lg font-semibold">AI Talk</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 flex flex-col p-4 md:p-10">
            <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 gap-8">
              <Card className="w-full shadow-lg flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>Conversational AI</CardTitle>
                  <CardDescription>
                    Click the microphone to start a continuous conversation with the AI.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                  <ScrollArea className="flex-1 pr-4 -mr-4">
                     <div className="space-y-4">
                       {conversation.length === 0 && !isProcessing && (
                         <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full py-10">
                            <Mic className="size-12 mb-4"/>
                            <p>Your conversation will appear here.</p>
                         </div>
                       )}
                       {conversation.map((msg, index) => (
                         <div
                            key={index}
                            className={cn(
                              "flex items-start gap-3",
                              msg.speaker === 'user' ? "justify-end" : "justify-start"
                            )}
                          >
                           {msg.speaker === 'ai' && <Bot className="size-6 text-primary shrink-0 mt-1" />}
                           <div
                             className={cn(
                               "rounded-lg px-4 py-2 max-w-[80%]",
                               msg.speaker === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                             )}
                           >
                             <p>{msg.text}</p>
                           </div>
                           {msg.speaker === 'user' && <User className="size-6 text-foreground shrink-0 mt-1" />}
                         </div>
                       ))}
                       {isProcessing && (
                         <div className="flex items-center gap-3 justify-start">
                           <Bot className="size-6 text-primary shrink-0 mt-1" />
                           <div className="bg-muted rounded-lg px-4 py-2 flex items-center space-x-2">
                              <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                              <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                              <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span>
                           </div>
                         </div>
                       )}
                     </div>
                  </ScrollArea>
                  
                  <div className="flex flex-col items-center gap-4 pt-4 border-t">
                    {hasMicPermission === false && (
                       <Alert variant="destructive">
                         <MicOff className="h-4 w-4" />
                         <AlertTitle>Microphone Access Required</AlertTitle>
                         <AlertDescription>
                           Please allow microphone access to use this feature.
                         </AlertDescription>
                       </Alert>
                    )}
                    <Button
                      onClick={toggleListening}
                      disabled={hasMicPermission === false || (isProcessing && !isListening)}
                      size="lg"
                      className={cn(
                        "w-full max-w-sm",
                        isListening && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      )}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="mr-2 h-4 w-4" />
                          Stop Listening
                        </>
                      ) : isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          AI is responding...
                        </>
                      ): (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          {conversation.length === 0 ? "Start Conversation" : "Speak Again"}
                        </>
                      )}
                    </Button>
                    {audioDataUri && <audio ref={audioRef} src={audioDataUri} className="hidden" />}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
