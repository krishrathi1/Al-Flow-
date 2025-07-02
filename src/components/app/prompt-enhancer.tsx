
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { Loader2, ImageUp, Wand2, Sparkles, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { enhancePrompt } from "@/ai/flows/prompt-enhance-flow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ActiveTab = "describe" | "enhance";

export function PromptEnhancer() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>("");

  const [enhancePromptText, setEnhancePromptText] = useState<string>("");

  const [activeTab, setActiveTab] = useState<ActiveTab>("describe");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string>("");
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please select a file smaller than 5MB.",
        });
        return;
      }
      setImageFile(selectedFile);
      setResponse(""); // Clear previous response
      const reader = new FileReader();
      reader.onload = (readEvt) => {
        setImageDataUri(readEvt.target?.result as string);
      };
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "File Error",
          description: "Could not read the selected file.",
        });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setResponse("");

    try {
      let result;
      if (activeTab === "describe") {
        if (!imageDataUri) {
          toast({ variant: "destructive", title: "Input Error", description: "Please upload an image to describe." });
          setIsLoading(false);
          return;
        }
        result = await enhancePrompt({
          prompt: imagePrompt,
          attachmentDataUri: imageDataUri,
        });
      } else { // activeTab === "enhance"
        if (!enhancePromptText.trim()) {
           toast({ variant: "destructive", title: "Input Error", description: "Please enter a prompt to enhance." });
           setIsLoading(false);
           return;
        }
        result = await enhancePrompt({
          prompt: enhancePromptText,
        });
      }
      setResponse(result.response);
      toast({ title: "Success!", description: "Your request was processed successfully." });
    } catch (error) {
      console.error("Error during enhancement/description:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    toast({
      title: "Copied!",
      description: "The response has been copied to your clipboard.",
    });
  };

  const handleDownload = () => {
    if (!response) return;
    const blob = new Blob([response], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'enhanced-prompt.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const canSubmitDescribe = !isLoading && !!imageFile;
  const canSubmitEnhance = !isLoading && !!enhancePromptText.trim();

  return (
    <SidebarProvider>
      <AppSidebar activePath="/prompt-enhance" showModelSelector={false} />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="transition-opacity md:opacity-0 md:group-hover/sidebar-wrapper:opacity-100" />
              <div className="flex items-center gap-2">
                <Wand2 className="size-5 text-primary" />
                <h1 className="text-lg font-semibold">Prompt Magic</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-10">
            <div className="max-w-4xl mx-auto grid gap-8">
              <Card className="w-full shadow-lg">
                <CardHeader>
                  <CardTitle>AI Prompt Tools</CardTitle>
                  <CardDescription>
                    Use AI to describe images or enhance your creative prompts.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="describe">Describe Image</TabsTrigger>
                      <TabsTrigger value="enhance">Enhance Prompt</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="describe" className="mt-4 space-y-4">
                      <div className="flex flex-col gap-2">
                         <label htmlFor="file-upload" className="flex items-center justify-center w-full h-32 px-4 transition bg-muted/50 border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary/80 focus:outline-none">
                            <span className="flex items-center space-x-2">
                               <ImageUp className="size-6 text-muted-foreground" />
                               <span className="font-medium text-muted-foreground">
                                {imageFile ? `Selected: ${imageFile.name}` : "Drop an image here or click to upload"}
                               </span>
                            </span>
                            <input id="file-upload" name="file-upload" type="file" className="hidden" onChange={handleFileChange} disabled={isLoading} accept="image/*" />
                        </label>
                        <Textarea
                            placeholder="Optional: Ask a specific question about the image (e.g., 'What style is this painting?')"
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            disabled={isLoading}
                        />
                      </div>
                       <Button onClick={handleSubmit} disabled={!canSubmitDescribe} size="lg" className="w-full">
                        {isLoading && activeTab === 'describe' ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Describing...</>
                        ) : (
                          <><Sparkles className="mr-2 h-4 w-4" /> Describe Image</>
                        )}
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="enhance" className="mt-4 space-y-4">
                      <Textarea
                          placeholder="e.g., 'a cat in a hat' or 'futuristic city'"
                          value={enhancePromptText}
                          onChange={(e) => setEnhancePromptText(e.target.value)}
                          disabled={isLoading}
                          className="h-32"
                      />
                       <Button onClick={handleSubmit} disabled={!canSubmitEnhance} size="lg" className="w-full">
                        {isLoading && activeTab === 'enhance' ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enhancing...</>
                        ) : (
                          <><Wand2 className="mr-2 h-4 w-4" /> Enhance Prompt</>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {(isLoading || response) && (
                <Card className="w-full shadow-lg min-h-[250px]">
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div className="space-y-1.5">
                            <CardTitle>AI Response</CardTitle>
                             <CardDescription>
                                {activeTab === "enhance" ? "Your enhanced prompt is ready." : "The image description is below."}
                            </CardDescription>
                        </div>
                         {response && !isLoading && (
                            <div className="flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={handleCopy} className="h-9 w-9">
                                            <Copy className="size-4" />
                                            <span className="sr-only">Copy</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Copy to clipboard</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={handleDownload} className="h-9 w-9">
                                            <Download className="size-4" />
                                            <span className="sr-only">Download</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Download as .txt</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center pt-10 gap-2 text-muted-foreground">
                                <Loader2 className="size-5 animate-spin" />
                                <p>The AI is thinking...</p>
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
