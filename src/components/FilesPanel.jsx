import { FileText, Download, ExternalLink } from 'lucide-react';
import { sharedFiles } from '../data/mockData';
import clsx from 'clsx';

const EXT_STYLE = {
  doc:  { bg: '#eff6ff', icon: '#3b82f6', border: '#bfdbfe', chipBg: '#dbeafe', chipText: '#1d4ed8' },
  docx: { bg: '#eff6ff', icon: '#3b82f6', border: '#bfdbfe', chipBg: '#dbeafe', chipText: '#1d4ed8' },
  pdf:  { bg: '#fef2f2', icon: '#ef4444', border: '#fecaca', chipBg: '#fee2e2', chipText: '#b91c1c' },
  fig:  { bg: '#faf5ff', icon: '#a855f7', border: '#e9d5ff', chipBg: '#f3e8ff', chipText: '#7e22ce' },
  zip:  { bg: '#fffbeb', icon: '#f59e0b', border: '#fde68a', chipBg: '#fef3c7', chipText: '#b45309' },
};

export function FilesPanel() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] px-6 py-6">

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-bold text-[#0f172a]">Shared Files</h3>
          <span className="text-[11px] font-semibold text-[#64748b] bg-white border border-[#e2e8f0] px-2.5 py-1 rounded-full shadow-sm">
            {sharedFiles.length} files
          </span>
        </div>

        <div className="grid gap-3">
          {sharedFiles.map(file => {
            const ext   = file.name.split('.').pop()?.toLowerCase() ?? 'doc';
            const style = EXT_STYLE[ext] ?? EXT_STYLE.doc;

            return (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 bg-white border border-[#e2e8f0]
                           rounded-xl hover:border-[#cbd5e1] hover:shadow-sm transition-all duration-150
                           cursor-pointer group"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border"
                     style={{ backgroundColor: style.bg, borderColor: style.border }}>
                  <FileText size={22} strokeWidth={1.8} style={{ color: style.icon }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#0f172a] truncate group-hover:text-[#4f46e5] transition-colors">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                          style={{ backgroundColor: style.chipBg, color: style.chipText }}>
                      {ext}
                    </span>
                    <span className="text-[11px] font-medium text-[#64748b]">{file.size}</span>
                    <span className="text-[#cbd5e1] text-[10px]">·</span>
                    <span className="text-[11px] font-medium text-[#64748b]">{file.date}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {[Download, ExternalLink].map((Icon, i) => (
                    <button key={i} className="w-9 h-9 flex items-center justify-center rounded-lg
                                               text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]
                                               transition-all duration-100 border border-transparent hover:border-[#e2e8f0]">
                      <Icon size={16} strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
