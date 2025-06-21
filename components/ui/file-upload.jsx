"use client"

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, Loader2 } from 'lucide-react';
import { Button } from './button';

export function FileUpload({ onUpload, isUploading }) {
  const [preview, setPreview] = useState(null);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onUpload(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': []
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}
      `}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p>Uploading...</p>
        </div>
      ) : preview ? (
        <div className="relative">
          <img src={preview} alt="Upload preview" className="mx-auto h-40 rounded-lg object-contain" />
          <p className="text-sm text-gray-500 mt-4">Drag 'n' drop a new file, or click to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <UploadCloud className="h-10 w-10 text-gray-400 mb-4" />
          <p className="font-semibold">Drag 'n' drop a file here, or click to select a file</p>
          <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
        </div>
      )}
    </div>
  );
} 