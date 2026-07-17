import { X, Download, FileText } from 'lucide-react';
import { useEffect } from 'react';

export function FileViewer({ file, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!file || !file.url) return null;

  const isImage = file.type?.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex flex-col text-white">
          <span className="font-semibold text-[15px]">{file.name}</span>
          <span className="text-[12px] text-white/60">{file.size}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            download={file.name}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-[13px] font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={16} />
            Download
          </a>
          
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div 
        className="flex-1 flex items-center justify-center p-6 overflow-hidden cursor-zoom-out"
        onClick={onClose}
      >
        <div 
          className="max-w-full max-h-full flex items-center justify-center cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {isImage ? (
            <img 
              src={file.url} 
              alt={file.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scale-in"
            />
          ) : isPdf ? (
            <iframe 
              src={file.url} 
              title={file.name}
              className="w-[80vw] h-[85vh] rounded-lg shadow-2xl bg-white animate-scale-in"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-white animate-scale-in">
              <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center">
                <FileText size={48} className="text-white/80" />
              </div>
              <p className="text-lg font-medium">No preview available</p>
              <p className="text-sm text-white/60">This file type cannot be previewed in the browser.</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                download={file.name}
                className="mt-4 px-6 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] rounded-lg font-medium transition-colors"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
