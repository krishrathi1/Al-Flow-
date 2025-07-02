
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
import { Loader2, FileUp, FileCode, Sparkles, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { actAsAiAgent } from "@/ai/flows/act-as-ai-agent";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper functions to extract text from different file types
const extractTextFromPptx = async (file: File): Promise<string> => {
    const JSZip = (await import('jszip')).default;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const parser = new DOMParser();
    
    let fullText = "";

    const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
    slideFiles.sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0', 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0', 10);
        return numA - numB;
    });

    for (const slideFile of slideFiles) {
        const slideNumber = slideFile.match(/slide(\d+)\.xml/)?.[1];
        fullText += `--- Slide ${slideNumber} ---\n`;
        const slideXmlString = await zip.file(slideFile)!.async('string');
        const xmlDoc = parser.parseFromString(slideXmlString, 'application/xml');
        const paragraphNodes = xmlDoc.getElementsByTagName('a:p');
        
        const paragraphTexts = Array.from(paragraphNodes).map(p => {
            const textElements = p.getElementsByTagName('a:t');
            return Array.from(textElements).map(t => t.textContent || "").join('');
        });

        fullText += paragraphTexts.filter(t => t).join('\n') + '\n\n';
    }

    const notesFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/notesSlides/notesSlide') && name.endsWith('.xml'));
    if (notesFiles.length > 0) {
        fullText += `--- Speaker Notes ---\n\n`;
        notesFiles.sort((a, b) => {
            const numA = parseInt(a.match(/notesSlide(\d+)\.xml$/)?.[1] || '0', 10);
            const numB = parseInt(b.match(/notesSlide(\d+)\.xml$/)?.[1] || '0', 10);
            return numA - numB;
        });

        for (const notesFile of notesFiles) {
            const slideNumber = notesFile.match(/notesSlide(\d+)\.xml/)?.[1];
            fullText += `--- Notes for Slide ${slideNumber} ---\n`;
            const notesXmlString = await zip.file(notesFile)!.async('string');
            const xmlDoc = parser.parseFromString(notesXmlString, 'application/xml');
            const paragraphNodes = xmlDoc.getElementsByTagName('a:p');
        
            const paragraphTexts = Array.from(paragraphNodes).map(p => {
                const textElements = p.getElementsByTagName('a:t');
                return Array.from(textElements).map(t => t.textContent || "").join('');
            });

            fullText += paragraphTexts.filter(t => t).join('\n') + '\n\n';
        }
    }
    return fullText.trim();
};

const extractTextFromDocx = async (file: File): Promise<string> => {
    const JSZip = (await import('jszip')).default;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlString = await zip.file('word/document.xml')?.async('string');

    if (!docXmlString) {
        throw new Error('Could not find document.xml in the .docx file.');
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXmlString, 'application/xml');
    
    const paragraphNodes = xmlDoc.getElementsByTagName('w:p');
    const paragraphTexts = Array.from(paragraphNodes).map(p => {
        const textElements = p.getElementsByTagName('w:t');
        return Array.from(textElements).map(t => t.textContent || "").join('');
    });

    return paragraphTexts.join('\n').trim();
};

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

export function FileReader() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>("");
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setExtractedText("");
    setExplanation("");
    setIsLoading(true);

    try {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      let extractedContent = "";

      switch (extension) {
        case 'pptx':
          extractedContent = await extractTextFromPptx(selectedFile);
          break;
        case 'docx':
          extractedContent = await extractTextFromDocx(selectedFile);
          break;
        case 'txt':
          extractedContent = await extractTextFromTxt(selectedFile);
          break;
        default:
          toast({
            variant: "destructive",
            title: "Unsupported File Type",
            description: "Please upload a .pptx, .docx, or .txt file.",
          });
          setFile(null);
          setIsLoading(false);
          return;
      }
      
      if (!extractedContent.trim()) {
          setExtractedText("");
           toast({
            variant: "destructive",
            title: "Empty File",
            description: "No text could be extracted from this file. Please try another.",
          });
      } else {
          setExtractedText(extractedContent);
          toast({
            title: "File Processed",
            description: "The file is ready for explanation.",
          });
      }
    } catch (error) {
      console.error("Error processing file:", error);
      let errorMessage = "An unexpected error occurred while processing the file.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: errorMessage,
      });
      setExtractedText("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!extractedText) {
      toast({
        variant: "destructive",
        title: "No Content",
        description: "Could not find text in the file to explain. Please try a different file.",
      });
      return;
    }
    
    setIsExplaining(true);
    setExplanation("");
    
    try {
      const prompt = `Please provide a concise summary and explanation of the following document content. Identify the key topics, main points, and overall narrative:\n\n${extractedText}`;
      
      const result = await actAsAiAgent({
        userPrompt: prompt,
        model: "googleai/gemini-2.0-flash",
      });
      
      setExplanation(result.response);
      toast({
        title: "Explanation Complete",
        description: "The AI has summarized the document.",
      });
      
    } catch (error) {
      console.error("Error explaining text:", error);
      let errorMessage = "An unexpected error occurred during explanation.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Explanation Failed",
        description: errorMessage,
      });
    } finally {
      setIsExplaining(false);
    }
  };

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    toast({
      title: "Copied!",
      description: "The summary has been copied to your clipboard.",
    });
  };

  const handleDownload = () => {
    if (!explanation) return;
    const blob = new Blob([explanation], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ai-summary.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canExplain = !isLoading && !isExplaining && !!extractedText;
  const isProcessing = isLoading || isExplaining;

  return (
    <SidebarProvider>
      <AppSidebar activePath="/file-reader" showModelSelector={false} />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="transition-opacity md:opacity-0 md:group-hover/sidebar-wrapper:opacity-100" />
              <div className="flex items-center gap-2">
                <FileCode className="size-5 text-primary" />
                <h1 className="text-lg font-semibold">File Analyzer</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-10">
            <div className="max-w-4xl mx-auto grid gap-8">
              <Card className="w-full shadow-lg">
                <CardHeader>
                  <CardTitle>Analyze a Document</CardTitle>
                  <CardDescription>
                    Upload a .docx, .pptx, or .txt file to extract its content and get an AI-powered summary.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4">
                     <label htmlFor="file-upload" className="flex items-center justify-center w-full h-32 px-4 transition bg-muted/50 border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary/80 focus:outline-none">
                        <span className="flex items-center space-x-2">
                           <FileUp className="size-6 text-muted-foreground" />
                           <span className="font-medium text-muted-foreground">
                            {file ? `Selected: ${file.name}` : "Drop a document here or click to upload"}
                           </span>
                        </span>
                        <input id="file-upload" name="file-upload" type="file" className="hidden" onChange={handleFileChange} disabled={isProcessing} accept=".pptx,.docx,.txt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" />
                    </label>

                    <Button onClick={handleExplain} disabled={!canExplain} size="lg">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing File...
                        </>
                      ) : isExplaining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Explaining...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Explain with AI
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {(isExplaining || explanation) && (
                <Card className="w-full shadow-lg">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="space-y-1.5">
                      <CardTitle>AI Summary & Explanation</CardTitle>
                      <CardDescription>The AI has summarized the document.</CardDescription>
                    </div>
                    {explanation && !isExplaining && (
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
                  <CardContent className="min-h-[200px] pt-0">
                    {isExplaining && !explanation ? (
                      <div className="flex items-center justify-center pt-10 gap-2 text-muted-foreground">
                        <Loader2 className="size-5 animate-spin" />
                        <p>AI is analyzing the content...</p>
                      </div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {explanation}
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
