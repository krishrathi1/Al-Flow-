
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
import { Loader2, ImageUp, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { actAsAiAgent } from "@/ai/flows/act-as-ai-agent";

export function ImageExplainer() {
  const [prompt, setPrompt] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
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
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (readEvt) => {
        setFileDataUri(readEvt.target?.result as string);
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

  const handleExplanation = async () => {
    if (!prompt.trim() || !fileDataUri) {
      toast({
        variant: "destructive",
        title: "Input Error",
        description: "Please provide both an image and a prompt.",
      });
      return;
    }

    setIsLoading(true);
    setResponse("");

    try {
      const result = await actAsAiAgent({
        userPrompt: prompt,
        attachmentDataUri: fileDataUri,
        model: "googleai/gemini-2.0-flash",
      });

      setResponse(result.response);
      toast({
        title: "Success!",
        description: "Explanation complete.",
      });
    } catch (error) {
      console.error("Error during image explanation:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Explanation Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canExplain = !isLoading && !!prompt.trim() && !!file;

  return (
    <SidebarProvider>
      <AppSidebar activePath="/document-analysis" showModelSelector={false} />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="transition-opacity md:opacity-0 md:group-hover/sidebar-wrapper:opacity-100" />
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <h1 className="text-lg font-semibold">Image Explainer (Gemini Only)</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-10">
            <div className="max-w-4xl mx-auto grid gap-8">
              <Card className="w-full shadow-lg">
                <CardHeader>
                  <CardTitle>Explain an Image with Gemini</CardTitle>
                  <CardDescription>
                    Upload an image and provide a prompt to have Gemini explain it for you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2">
                     <label htmlFor="file-upload" className="flex items-center justify-center w-full h-32 px-4 transition bg-muted/50 border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary/80 focus:outline-none">
                        <span className="flex items-center space-x-2">
                           <ImageUp className="size-6 text-muted-foreground" />
                           <span className="font-medium text-muted-foreground">
                            {file ? `Selected: ${file.name}` : "Drop an image here or click to upload"}
                           </span>
                        </span>
                        <input id="file-upload" name="file-upload" type="file" className="hidden" onChange={handleFileChange} disabled={isLoading} accept="image/*" />
                    </label>

                    <Textarea
                        placeholder="e.g., 'What is in this image?' or 'Describe the main objects and their interactions.'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        className="h-24"
                    />
                  </div>
                   <Button onClick={handleExplanation} disabled={!canExplain} size="lg" className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Explaining...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Explain
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {(isLoading || response) && (
                <Card className="w-full shadow-lg min-h-[300px]">
                    <CardHeader>
                        <CardTitle>Explanation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Loader2 className="size-5 animate-spin" />
                                <p>Gemini is thinking...</p>
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
