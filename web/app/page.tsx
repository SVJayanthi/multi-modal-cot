"use client";

import { useState } from 'react';
import { useChat } from 'ai/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { FileUploader } from "@/components/ui/file-uploader";
import { Thinking } from "@/components/ui/thinking";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { messages, input, handleInputChange, handleSubmit, append } = useChat();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() && !selectedFile) return;

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await append({
          role: 'user',
          content: input || 'What do you see in this image?',
          experimental_attachments: [{
            contentType: selectedFile.type,
            url: base64,
          }],
        });
        setSelectedFile(null);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Chat Interface</h1>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
          {messages.map((message) => {
            // Parse thinking content from assistant messages
            let thinkingContent = null;
            let finalContent = message.content;
            
            if (message.role === "assistant" && message.content) {
              const thinkingMatch = message.content.match(/<thinking>([\s\S]*?)<\/thinking>/);
              if (thinkingMatch) {
                thinkingContent = thinkingMatch[1].trim();
                finalContent = message.content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
              }
            }

            // Parse thinking steps
            let thinkingSteps: { title: string; content: string; }[] = [];
            if (thinkingContent) {
              const stepMatches = thinkingContent.match(/Step \d+: ([^\n]+)\n([\s\S]*?)(?=Step \d+:|$)/g);
              if (stepMatches) {
                thinkingSteps = stepMatches.map(step => {
                  const stepMatch = step.match(/Step \d+: ([^\n]+)\n([\s\S]*)/);
                  if (stepMatch) {
                    return {
                      title: stepMatch[1].trim(),
                      content: stepMatch[2].trim()
                    };
                  }
                  return null;
                }).filter((step): step is { title: string; content: string } => step !== null);
              }
            }

            return (
              <div key={message.id} className="space-y-2">
                {/* Show thinking steps for assistant messages */}
                {message.role === "assistant" && thinkingSteps.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <Thinking
                        steps={thinkingSteps}
                        isVisible={true}
                      />
                    </div>
                  </div>
                )}
                
                {/* Regular message */}
                <div
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <Card
                    className={`max-w-[70%] ${
                      message.role === "user" ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <CardContent
                      className={`p-3 ${
                        message.role === "user"
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      <div className="space-y-2">
                        {message.experimental_attachments && message.experimental_attachments.length > 0 && (
                          <div className="space-y-2">
                            {message.experimental_attachments.map((attachment, index) => (
                              <img
                                key={index}
                                src={attachment.url}
                                alt="Uploaded image"
                                className="max-w-full h-auto rounded"
                              />
                            ))}
                          </div>
                        )}
                        {finalContent}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <footer className="border-t p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {selectedFile && (
            <div className="flex justify-center">
              <FileUploader
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onRemoveFile={() => setSelectedFile(null)}
              />
            </div>
          )}
          
          <div className="space-y-2">
            {!selectedFile && (
              <FileUploader
                onFileSelect={setSelectedFile}
              />
            )}
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </div>
      </footer>
    </div>
  );
}
