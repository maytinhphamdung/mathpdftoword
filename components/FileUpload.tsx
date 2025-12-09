import React, { useState, useCallback, useRef } from 'react';
import Button from './Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const pdfFile = Array.from(files).find(
        (file) => file.type === 'application/pdf'
      );
      if (pdfFile) {
        onFileSelect(pdfFile);
      } else {
        alert('Please drop a PDF file.');
      }
    }
  }, [onFileSelect, disabled]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      const pdfFile = Array.from(files).find(
        (file) => file.type === 'application/pdf'
      );
      if (pdfFile) {
        onFileSelect(pdfFile);
      } else {
        alert('Please select a PDF file.');
      }
    }
  }, [onFileSelect, disabled]);

  const triggerFileInput = useCallback(() => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const dropzoneClasses = `
    flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer
    transition-colors duration-200 ease-in-out
    ${isDragOver ? 'border-teal-500 bg-teal-50' : 'border-gray-300 bg-white hover:border-teal-400'}
    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
  `;

  return (
    <div
      className={dropzoneClasses}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={triggerFileInput}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
        disabled={disabled}
      />
      <svg
        className="w-16 h-16 text-teal-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        ></path>
      </svg>
      <p className="text-lg text-gray-700 font-medium text-center">
        Kéo và thả tệp PDF vào đây
      </p>
      <p className="text-sm text-gray-500 mt-1">hoặc</p>
      <Button
        type="button"
        onClick={triggerFileInput}
        className="mt-4"
        disabled={disabled}
      >
        Chọn tệp từ máy tính
      </Button>
      {isDragOver && (
        <div className="absolute inset-0 bg-teal-100 bg-opacity-70 flex items-center justify-center rounded-xl pointer-events-none">
          <p className="text-xl font-bold text-teal-700">Thả tệp PDF của bạn</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;