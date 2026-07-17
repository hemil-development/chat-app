import { X, Download, FileText, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';

export function FileViewer({ file, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [sheetHtml, setSheetHtml] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const docxContainerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const ext = file?.name?.split('.').pop()?.toLowerCase();
  const isImage = file?.type?.startsWith('image/');
  const isPdf = file?.type === 'application/pdf' || ext === 'pdf';
  const isDocx = ext === 'docx';
  const isExcel = ext === 'xls' || ext === 'xlsx';
  const isPpt = ext === 'ppt' || ext === 'pptx';

  // Some backends serve files with a query param that forces
  // Content-Disposition: attachment (e.g. ?download=...). That's fine for
  // fetch()-based previews (docx/xlsx) since JS reads the bytes directly,
  // but it breaks inline rendering in an <embed>/<iframe>, which instead
  // triggers a download. Strip it for the inline preview URL only.
  const previewUrl = file?.url?.split('?download=')[0] || file?.url;

  const [pdfFailed, setPdfFailed] = useState(false);
  useEffect(() => {
    setPdfFailed(false);
  }, [file?.url]);

  // Load + convert the file client-side when it changes
  useEffect(() => {
    setSheetNames([]);
    setSheetHtml([]);
    setActiveSheet(0);
    setError(null);

    if (!file?.url) return;

    if (isDocx) {
      setLoading(true);
      fetch(file.url)
        .then((res) => res.blob())
        .then((blob) => {
          if (!docxContainerRef.current) return;
          docxContainerRef.current.innerHTML = '';
          return renderAsync(blob, docxContainerRef.current, undefined, {
            className: 'docx-page',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            experimental: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
          });
        })
        .catch(() => setError('This document could not be previewed.'))
        .finally(() => setLoading(false));
    } else if (isExcel) {
      setLoading(true);
      fetch(file.url)
        .then((res) => res.arrayBuffer())
        .then((buf) => {
          const workbook = XLSX.read(buf, { type: 'array' });
          const names = workbook.SheetNames;
          const htmls = names.map((name) =>
            XLSX.utils.sheet_to_html(workbook.Sheets[name])
          );
          setSheetNames(names);
          setSheetHtml(htmls);
        })
        .catch(() => setError('This spreadsheet could not be previewed.'))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.url]);

  if (!file || !file.url) return null;

  const Spinner = () => (
    <div className="flex flex-col items-center justify-center gap-3 text-white">
      <Loader2 size={32} className="animate-spin text-white/70" />
      <p className="text-sm text-white/60">Loading preview…</p>
    </div>
  );

  const NoPreview = ({ message }) => (
    <div className="flex flex-col items-center justify-center gap-4 text-white animate-scale-in">
      <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center">
        <FileText size={48} className="text-white/80" />
      </div>
      <p className="text-lg font-medium">No preview available</p>
      <p className="text-sm text-white/60">{message}</p>
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
  );

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
        className={`flex-1 overflow-hidden cursor-zoom-out ${
          isDocx ? '' : 'flex items-center justify-center p-6'
        }`}
        onClick={onClose}
      >
        <div
          className={
            isDocx
              ? 'w-full h-full cursor-default'
              : 'max-w-full max-h-full w-full h-full flex items-center justify-center cursor-default'
          }
          onClick={(e) => e.stopPropagation()}
        >
          {isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scale-in"
            />
          ) : isPdf ? (
            pdfFailed ? (
              <NoPreview message="This PDF couldn't be displayed inline — you can still download it." />
            ) : (
              // Native browser PDF rendering — no external viewer, no wasted margins
              <object
                data={previewUrl}
                type="application/pdf"
                className="w-[92vw] h-[88vh] rounded-lg shadow-2xl bg-white animate-scale-in"
                onError={() => setPdfFailed(true)}
              >
                {/* Fallback for browsers where <object> doesn't fire onError for bad content */}
                <iframe
                  src={previewUrl}
                  title={file.name}
                  className="w-[92vw] h-[88vh] rounded-lg shadow-2xl bg-white border-none"
                  onError={() => setPdfFailed(true)}
                />
              </object>
            )
          ) : isDocx ? (
            <div className="w-full h-full animate-scale-in overflow-auto relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner />
                </div>
              )}
              {error ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <NoPreview message={error} />
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <div ref={docxContainerRef} className="docx-render" />
                </div>
              )}
            </div>
          ) : isExcel ? (
            loading ? (
              <Spinner />
            ) : error ? (
              <NoPreview message={error} />
            ) : (
              <div className="w-[92vw] h-[88vh] rounded-lg shadow-2xl bg-white animate-scale-in flex flex-col overflow-hidden">
                {sheetNames.length > 1 && (
                  <div className="flex gap-1 border-b border-gray-200 px-3 pt-2 bg-gray-50 overflow-x-auto shrink-0">
                    {sheetNames.map((name, i) => (
                      <button
                        key={name}
                        onClick={() => setActiveSheet(i)}
                        className={`px-3 py-1.5 text-[13px] rounded-t-md font-medium whitespace-nowrap transition-colors ${
                          i === activeSheet
                            ? 'bg-white text-indigo-600 border border-b-0 border-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex-1 overflow-auto p-4">
                  <div
                    className="xlsx-preview"
                    dangerouslySetInnerHTML={{ __html: sheetHtml[activeSheet] || '' }}
                  />
                </div>
              </div>
            )
          ) : isPpt ? (
            <NoPreview message="Slide previews aren't supported yet — download the file to view it." />
          ) : (
            <NoPreview message="This file type cannot be previewed in the browser." />
          )}
        </div>
      </div>

      {/* Scoped styles for converted document/spreadsheet previews */}
      <style>{`
        /* docx-preview renders each page as its own div.docx-page inside .docx-render */
        .docx-render {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .docx-render,
        .docx-render .docx-wrapper {
          background: transparent !important;
          padding: 0 !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .docx-render .docx-page,
        .docx-render .docx-wrapper > section {
          background: #ffffff !important;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin: 0 !important;
        }

        .xlsx-preview table { border-collapse: collapse; font-size: 13px; }
        .xlsx-preview td, .xlsx-preview th {
          border: 1px solid #e5e7eb;
          padding: 4px 10px;
          white-space: nowrap;
        }
        .xlsx-preview tr:nth-child(even) { background: #fafafa; }
      `}</style>
    </div>
  );
}