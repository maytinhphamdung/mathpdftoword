import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Loader2, AlertCircle } from 'lucide-react';
import FileUploader from './components/FileUploader';
import ResultPreview from './components/ResultPreview';
import { processFile } from './services/pdfProcessor';
import { generateDocx } from './services/docxGenerator';
import { PageResult, ProcessStatus } from './types';

const App: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<ProcessStatus | null>(null);
  const [results, setResults] = useState<PageResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pre-load worker silently on mount to catch errors early
  useEffect(() => {
    // We could call a dummy load here if needed, but processFile handles it.
  }, []);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setResults([]);
    
    try {
      const extractedData = await processFile(file, (message, current, total) => {
        setStatus({ message, current, total });
      });
      setResults(extractedData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred processing the file.");
    } finally {
      setIsProcessing(false);
      setStatus(null);
    }
  };

  const handleExport = async () => {
    if (results.length === 0) return;
    try {
      const blob = await generateDocx(results);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Math_OCR_Export.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to generate Word document");
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-teal-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <LayoutDashboard size={24} className="text-teal-50" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">MathGemini OCR</h1>
            <p className="text-teal-200 text-xs">PDF/Image to Word with Precise Graph Cropping</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50 py-10 px-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Intro Section */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-3">
              Extract Math & Figures
            </h2>
            <p className="text-gray-600 max-w-lg mx-auto">
              Upload your Vietnamese math exams (PDF/Image). We use AI to separate LaTeX text from 
              Variation Tables (Bảng biến thiên) and Geometry figures.
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <FileUploader onFileSelect={handleFileSelect} disabled={isProcessing} />
            
            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-pulse">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Progress Indicator */}
            {isProcessing && status && (
               <div className="mt-6">
                 <div className="flex justify-between text-sm font-medium text-teal-800 mb-2">
                   <span>{status.message}</span>
                   <span>{Math.round((status.current / status.total) * 100)}%</span>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                   <div 
                      className="bg-teal-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${(status.current / status.total) * 100}%` }}
                   ></div>
                 </div>
                 <div className="flex justify-center mt-4">
                    <Loader2 className="animate-spin text-teal-600" size={24} />
                 </div>
               </div>
            )}
          </div>

          {/* Results Section */}
          <ResultPreview 
            results={results} 
            onExport={handleExport} 
            isExporting={false} 
          />

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-6 text-center text-gray-500 text-sm">
        <p>Powered by Google Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
};

export default App;