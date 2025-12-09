import React, { useCallback, useState } from 'react';
import { Upload, FileImage, Clipboard } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect, disabled]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (disabled) return;
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      onFileSelect(e.clipboardData.files[0]);
    }
  }, [onFileSelect, disabled]);

  React.useEffect(() => {
    // Cast to any to handle DOM event type mismatch
    document.addEventListener('paste', handlePaste as any);
    return () => document.removeEventListener('paste', handlePaste as any);
  }, [handlePaste]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300
        ${isDragging ? 'border-teal-500 bg-teal-50 scale-105' : 'border-gray-300 bg-white hover:border-teal-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="bg-teal-100 p-4 rounded-full">
          <Upload className="w-8 h-8 text-teal-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700">
            Upload PDF or Image
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Drag & drop, click to browse, or <span className="font-bold text-teal-600 flex items-center inline-flex gap-1"><Clipboard size={14}/> Paste (Ctrl+V)</span>
          </p>
        </div>
        <input
          type="file"
          accept=".pdf, image/*"
          className="hidden"
          id="fileInput"
          disabled={disabled}
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        />
        <label
          htmlFor="fileInput"
          className={`
            px-6 py-2 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 transition
            font-medium text-sm
            ${disabled ? 'pointer-events-none' : ''}
          `}
        >
          Select File
        </label>
      </div>
    </div>
  );
};

export default FileUploader;