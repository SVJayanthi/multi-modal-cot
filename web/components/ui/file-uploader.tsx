'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './button';
import { Card, CardContent } from './card';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File;
  onRemoveFile?: () => void;
}

export function FileUploader({ onFileSelect, selectedFile, onRemoveFile }: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  if (selectedFile) {
    return (
      <Card className="w-full max-w-xs">
        <CardContent className="p-4">
          <div className="space-y-2">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Selected image"
              className="w-full h-32 object-cover rounded"
            />
            <div className="text-sm text-muted-foreground truncate">
              {selectedFile.name}
            </div>
            <Button 
              onClick={onRemoveFile}
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-primary bg-primary/10' 
          : 'border-muted-foreground/25 hover:border-primary/50'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="space-y-2">
        <div className="text-muted-foreground">
          {isDragActive ? (
            <p>Drop the image here...</p>
          ) : (
            <p>Drag & drop an image here, or click to select</p>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Supports PNG, JPG, GIF, WebP (max 10MB)
        </div>
      </div>
    </div>
  );
}