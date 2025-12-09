import React from 'react';
import { PageResult, BlockType } from '../types';
import { Download, FileText, Image as ImageIcon } from 'lucide-react';

interface ResultPreviewProps {
  results: PageResult[];
  onExport: () => void;
  isExporting: boolean;
}

const ResultPreview: React.FC<ResultPreviewProps> = ({ results, onExport, isExporting }) => {
  if (results.length === 0) return null;

  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-teal-900">Extraction Results</h2>
        <button
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-lg shadow-lg transition disabled:opacity-50"
        >
          <Download size={18} />
          {isExporting ? "Generating..." : "Export to Word"}
        </button>
      </div>

      <div className="space-y-8">
        {results.map((page) => (
          <div key={page.pageNumber} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
              <span className="font-semibold text-gray-500 text-sm uppercase tracking-wider">Page {page.pageNumber}</span>
            </div>
            
            <div className="p-6 space-y-6">
              {page.blocks.map((block, idx) => (
                <div key={idx} className="relative group">
                  {block.type === BlockType.TEXT ? (
                    <div className="flex gap-4 items-start p-3 rounded-lg hover:bg-gray-50 transition">
                      <FileText className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-gray-800 whitespace-pre-wrap font-serif leading-relaxed text-lg">
                        {block.content}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-teal-200 rounded-xl p-4 bg-teal-50/30">
                      <div className="flex items-center gap-2 mb-3 text-teal-700 text-sm font-medium">
                        <ImageIcon size={16} />
                        <span>Detected Figure (Auto-cropped)</span>
                      </div>
                      {block.imageBase64 ? (
                        <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm inline-block">
                          <img 
                            src={block.imageBase64} 
                            alt="Cropped Math Figure" 
                            className="max-w-full h-auto max-h-64 object-contain" 
                          />
                        </div>
                      ) : (
                         <div className="text-red-500">Failed to load crop</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultPreview;