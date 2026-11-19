import React, { useEffect } from 'react';
import { Download, FileText, X } from 'lucide-react';

export interface PdfPreviewState {
  blobUrl: string;
  filename: string;
  title: string;
  subtitle?: string;
}

interface PdfPreviewModalProps {
  preview: PdfPreviewState | null;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ preview, onClose }) => {
  useEffect(() => {
    if (!preview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [preview, onClose]);

  useEffect(() => {
    const urlToRevoke = preview?.blobUrl;
    return () => {
      if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(urlToRevoke);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [preview?.blobUrl]);

  if (!preview) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = preview.blobUrl;
    link.download = preview.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={preview.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Clean Institutional Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate font-manrope">
                {preview.title}
              </h3>
              {preview.subtitle && (
                <p className="text-xs text-slate-500 truncate">{preview.subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewer */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden">
          <iframe
            src={`${preview.blobUrl}#toolbar=1&navpanes=0&view=FitH`}
            title={preview.title}
            className="w-full h-full border-0 bg-white"
          />
        </div>

        {/* Subtle Fallback Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <span className="truncate font-mono text-[11px] text-slate-600">{preview.filename}</span>
          <div className="flex items-center gap-3">
            <span>If your browser hides inline PDFs, use Download PDF above.</span>
            <button
              type="button"
              onClick={onClose}
              className="font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
