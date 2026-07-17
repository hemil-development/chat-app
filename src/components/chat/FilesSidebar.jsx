import { Search, Filter, SlidersHorizontal, FileText, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';

const MOCK_FILES = [
  { id: 1, name: 'image.png', sender: 'Nehal | Nehal Shetty', date: '03:29 PM', type: 'image' },
  { id: 2, name: 'image.png', sender: 'Nehal | Nehal Shetty', date: '03:01 PM', type: 'image' },
  { id: 3, name: 'React_Next_Supabase_C...', sender: 'Nehal | Nehal Shetty', date: '02:41 PM', type: 'doc' },
  { id: 4, name: 'image.png', sender: 'Rishi | Rishi Patel', date: '02:19 PM', type: 'image' },
  { id: 5, name: 'image.png', sender: 'Parth | Digipie Website', date: '02:18 PM', type: 'image' },
  { id: 6, name: 'chat-implementation-pla...', sender: 'Nehal | Nehal Shetty', date: '01:09 PM', type: 'doc' },
  { id: 7, name: 'image.png', sender: 'Akash | Digipie Website', date: '01:04 PM', type: 'image' },
  { id: 8, name: 'Chat_Implementation_Pl...', sender: 'Nehal | Nehal Shetty', date: '01:01 PM', type: 'doc' },
];

export function FilesSidebar() {
  return (
    <div className="flex flex-col w-full flex-shrink-0 h-full bg-transparent">
      {/* Header Area */}
      <div className="px-4 pt-4 pb-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-[#e2e8f0]
                        rounded-md px-2.5 py-1.5 shadow-sm focus-within:border-[#4f46e5] focus-within:ring-1 focus-within:ring-[#4f46e5] transition-all mb-3">
          <Search size={13} className="text-[#94a3b8] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 bg-transparent text-[13px] text-[#0f172a] placeholder:text-[#94a3b8]
                       outline-none min-w-0"
          />
        </div>

        <div className="flex items-center justify-between mb-1">
          <span className="text-[#0f172a] font-bold text-[14px]">
            Files
          </span>
          <div className="flex items-center gap-1">
            <button className="flex items-center justify-center w-6 h-6 rounded-md text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] transition-colors">
              <Filter size={14} strokeWidth={2.5} />
            </button>
            <button className="flex items-center justify-center w-6 h-6 rounded-md text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] transition-colors">
              <SlidersHorizontal size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1 px-2 space-y-0.5">
        {MOCK_FILES.map(file => {
          const isDoc = file.type === 'doc';
          return (
            <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f1f5f9] cursor-pointer transition-colors group">
              <div className={clsx(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border',
                isDoc ? 'bg-[#eff6ff] border-[#bfdbfe]' : 'bg-white border-[#e2e8f0]'
              )}>
                {isDoc 
                  ? <FileText size={20} strokeWidth={2} className="text-[#3b82f6]" />
                  : <ImageIcon size={18} strokeWidth={1.5} className="text-[#cbd5e1]" />
                }
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[13px] text-[#0f172a] font-semibold leading-tight line-clamp-1">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-[#94a3b8] flex-shrink-0 tabular-nums font-medium whitespace-nowrap mt-0.5">
                    {file.date}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748b] truncate mt-0.5 group-hover:text-[#475569]">
                  {file.sender}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
