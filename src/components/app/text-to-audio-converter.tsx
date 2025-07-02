
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/app-sidebar';
import { Loader2, FileUp, FileAudio, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const extractTextFromTxt = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(e.target.result as string);
            } else {
                reject(new Error("Failed to read .txt file"));
            }
        };
        reader.onerror = () => {
            reject(new Error("Failed to read .txt file"));
        };
        reader.readAsText(file);
    });
};

const languages = [
  { name: "Auto-detect", code: "auto" },
  { name: "English (US)", code: "en-US" },
  { name: "Spanish (Spain)", code: "es-ES" },
  { name: "French (France)", code: "fr-FR" },
  { name: "German (Germany)", code: "de-DE" },
  { name: "Japanese (Japan)", code: "ja-JP" },
  { name: "Chinese (Mandarin)", code: "zh-CN" },
  { name: "Korean (South Korea)", code: "ko-KR" },
  { name: "Russian (Russia)", code: "ru-RU" },
  { name: "Hindi (India)", code: "hi-IN" },
];

export function TextToAudioConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [languageCode, setLanguageCode] = useState<string>("auto");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [audioDataUri, setAudioDataUri] = useState<string>("");
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/plain') {
        toast({
            variant: "destructive",
            title: "Unsupported File Type",
            description: "Please upload a .txt file.",
        });
        setFile(null);
        setText("");
        return;
    }
    
    setFile(selectedFile);
    setAudioDataUri("");

    try {
      const extractedContent = await extractTextFromTxt(selectedFile);
      setText(extractedContent);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "File Read Error",
        description: "Could not read text from the file.",
      });
      setText("");
    }
  };

  const handleConvert = async () => {
    if (!text.trim()) {
      toast({
        variant: "destructive",
        title: "No Text",
        description: "There is no text to convert to audio. Please upload a file or type in the text area.",
      });
      return;
    }
    
    setIsLoading(true);
    setAudioDataUri("");
    
    try {
      const result = await textToSpeech({ text, languageCode });
      
      setAudioDataUri(result.audioDataUri);
      toast({
        title: "Conversion Complete",
        description: "Your text has been converted to audio.",
      });
      
    } catch (error) {
      console.error("Error converting text to speech:", error);
      let errorMessage = "An unexpected error occurred during conversion.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!audioDataUri) return;
    const link = document.createElement('a');
    link.href = audioDataUri;
    const fileName = file ? file.name.replace(/\.[^/.]+$/, "") + '.wav' : 'audio.wav';
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const canConvert = !isLoading && !!text.trim();

  return (
    <SidebarProvider>
      <AppSidebar activePath="/text-to-audio" showModelSelector={false} />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="transition-opacity md:opacity-0 md:group-hover/sidebar-wrapper:opacity-100" />
              <div className="flex items-center gap-2">
                <FileAudio className="size-5 text-primary" />
                <h1 className="text-lg font-semibold">Text to Audio Converter</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-10">
            <div className="max-w-4xl mx-auto grid gap-8">
              <Card className="w-full shadow-lg">
                <CardHeader>
                  <CardTitle>Convert Text to Audio</CardTitle>
                  <CardDescription>
                    Upload a .txt file or paste text. It will be translated into your selected language and then converted into speech.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <label htmlFor="file-upload" className="flex items-center justify-center w-full h-32 px-4 transition bg-muted/50 border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary/80 focus:outline-none">
                        <span className="flex items-center space-x-2">
                           <FileUp className="size-6 text-muted-foreground" />
                           <span className="font-medium text-muted-foreground text-center">
                            {file ? `Selected: ${file.name}` : "Drop a .txt file here or click to upload"}
                           </span>
                        </span>
                        <input id="file-upload" name="file-upload" type="file" className="hidden" onChange={handleFileChange} disabled={isLoading} accept="text/plain" />
                    </label>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or paste text</span>
                        </div>
                    </div>
                     <div>
                        <Textarea
                            placeholder="Paste your text here..."
                            value={text}
                            onChange={(e) => {
                                setText(e.target.value);
                                setFile(null);
                            }}
                            disabled={isLoading}
                            className="h-48"
                        />
                    </div>
                  </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="language-select">Output Language</Label>
                        <Select value={languageCode} onValueChange={setLanguageCode} disabled={isLoading}>
                            <SelectTrigger id="language-select">
                                <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                    {lang.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                  <Button onClick={handleConvert} disabled={!canConvert} size="lg" className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <FileAudio className="mr-2 h-4 w-4" />
                        Convert to Audio
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {(isLoading || audioDataUri) && (
                <Card className="w-full shadow-lg">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="space-y-1.5">
                      <CardTitle>Generated Audio</CardTitle>
                      <CardDescription>Your audio file is ready to be played or downloaded.</CardDescription>
                    </div>
                    {audioDataUri && !isLoading && (
                      <Button variant="outline" size="icon" onClick={handleDownload} className="h-9 w-9">
                          <Download className="size-4" />
                          <span className="sr-only">Download</span>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="min-h-[100px] pt-0 flex items-center justify-center">
                    {isLoading && !audioDataUri ? (
                      <div className="flex items-center pt-10 gap-2 text-muted-foreground">
                        <Loader2 className="size-5 animate-spin" />
                        <p>AI is generating the audio...</p>
                      </div>
                    ) : (
                      audioDataUri && <audio controls src={audioDataUri} className="w-full" />
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
