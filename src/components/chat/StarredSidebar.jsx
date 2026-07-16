import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

const MOCK_STARRED = [
  { id: 1, name: 'Parth Chauhan', preview: 'Sumit: admin@digipie.com', date: '06/07/2026', initial: 'P', color: '#64748b' },
  { id: 2, name: 'Nehal Shetty', preview: 'Nehal: I have pushed the', date: '25/06/2026', initial: 'N', color: '#22c55e' },
  { id: 3, name: 'Neil | SaaS | Shahid', preview: 'Sumit: EH afternoon @Shahid', date: '08/06/2026', initial: 'N', color: '#10b981' },
  { id: 4, name: 'Tanvi | Payal', preview: 'Yashvi: these are requirements', date: '01/04/2026', initial: 'T', color: '#06b6d4' },
  { id: 5, name: 'Agentipus ( PP6 )', preview: 'Shubhamraj: Agentipus Team', date: '09/03/2026', initial: 'A', color: '#10b981' },
  { id: 6, name: 'Sumit Pandya', preview: 'Sumit: sumitpanyapie010725@', date: '05/02/2026', initial: 'S', color: '#eab308' },
  { id: 7, name: 'Akash Soni', preview: 'Akash: https://github.com/Moxx', date: '19/01/2026', initial: 'A', color: '#3b82f6' },
  { id: 8, name: 'Chetan Rajput', preview: 'Sumit: [https://sjcgrouporg.shar', date: '19/01/2026', initial: 'C', color: '#f59e0b' },
];

export function StarredSidebar() {
  return (
    <div className="flex flex-col w-[280px] flex-shrink-0 bg-[#f8fafc] h-screen border-r border-[#e2e8f0]">
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
            Starred Messages
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
        {MOCK_STARRED.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f1f5f9] cursor-pointer transition-colors group">
            <div className="relative flex-shrink-0">
              <Avatar initials={item.initial} color={item.color} size="md" borderColor="#f8fafc" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[13px] text-[#0f172a] font-semibold leading-tight line-clamp-1">
                  {item.name}
                </span>
                <span className="text-[10px] text-[#94a3b8] flex-shrink-0 tabular-nums font-medium whitespace-nowrap mt-0.5">
                  {item.date}
                </span>
              </div>
              <p className="text-[12px] text-[#64748b] truncate mt-0.5 group-hover:text-[#475569]">
                {item.preview}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
