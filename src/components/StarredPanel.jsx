import { Star, FileText, MessageSquare } from 'lucide-react';
import { starredMessages } from '../data/mockData';
import { currentUser, contacts } from '../data/mockData';
import { Avatar } from './ui/Avatar';
import clsx from 'clsx';

export function StarredPanel() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] px-6 py-6">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-bold text-[#0f172a]">Starred Messages</h3>
          <span className="text-[11px] font-semibold text-[#64748b] bg-white border border-[#e2e8f0] px-2.5 py-1 rounded-full shadow-sm">
            {starredMessages.length} starred
          </span>
        </div>

        {starredMessages.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#fef3c7] border border-[#fde68a] flex items-center justify-center mb-4">
              <Star size={26} className="text-[#f59e0b]" strokeWidth={1.8} />
            </div>
            <p className="text-[14px] font-bold text-[#475569] mb-1">No starred messages</p>
            <p className="text-[12px] text-[#64748b]">Star messages to find them here easily</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {starredMessages.map(msg => {
              const sender = msg.senderId === 'me'
                ? currentUser
                : contacts.find(c => c.id === msg.senderId);

              return (
                <div
                  key={msg.id}
                  className="flex items-start gap-4 p-4 bg-white border border-[#e2e8f0]
                             rounded-xl hover:border-[#cbd5e1] hover:shadow-sm transition-all duration-150
                             cursor-pointer group"
                >
                  <Avatar initials={sender?.initials} color={sender?.color} size="md" borderColor="#ffffff" />

                  <div className="flex-1 min-w-0 mt-0.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[13px] font-bold text-[#0f172a]">{sender?.name}</span>
                      <span className="text-[11px] font-medium text-[#94a3b8] tabular-nums">{msg.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {msg.type === 'file'
                        ? <FileText size={14} className="text-[#3b82f6] flex-shrink-0" />
                        : <MessageSquare size={14} className="text-[#cbd5e1] flex-shrink-0" />
                      }
                      <p className="text-[13px] text-[#475569] truncate font-medium">{msg.text}</p>
                    </div>
                  </div>

                  <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-150
                                     w-8 h-8 flex items-center justify-center rounded-lg
                                     hover:bg-[#fef3c7] text-[#f59e0b]">
                    <Star size={16} strokeWidth={2} fill="currentColor" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
