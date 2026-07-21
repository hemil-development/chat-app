import { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useChat } from '../../context/ChatContext';
import { supabase } from '../../lib/supabase';
import { formatMessageTime } from '../../utils/helpers';

export function FilesSidebar() {
  const { companyUserId, contacts } = useChat();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyUserId || !contacts) {
      setLoading(false);
      return;
    }

    const fetchFiles = async () => {
      try {
        setLoading(true);
        const roomIds = contacts.map(c => c.roomId).filter(Boolean);
        if (roomIds.length === 0) {
          setFiles([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('chat_messages')
          .select('*, company_users!chat_messages_created_by_fkey(users(first_name, last_name))')
          .eq('type', 'file')
          .in('room_id', roomIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map(m => {
          let meta = {};
          try {
            meta = JSON.parse(m.message);
          } catch (e) {}

          const fname = m.company_users?.users?.first_name || 'Someone';
          const lname = m.company_users?.users?.last_name || '';
          return {
            id: m.id,
            name: meta.name || 'Unknown File',
            size: meta.size || 'Unknown',
            type: meta.type || '',
            sender: `${fname} ${lname}`.trim(),
            date: formatMessageTime(m.created_at),
            url: meta.url || '#'
          };
        });
        setFiles(formatted);
      } catch (err) {
        console.error("Error fetching files:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [companyUserId, contacts]);

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
        {loading ? (
          <div className="flex-1 flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 text-[#94a3b8] animate-spin" />
          </div>
        ) : files.length > 0 ? (
          files.map(file => {
            const isImage = file.type?.startsWith('image/');
            const Icon = isImage ? ImageIcon : FileText;

            return (
              <a 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                key={file.id} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f1f5f9] cursor-pointer transition-colors group"
              >
                <div className={clsx(
                  "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 transition-colors",
                  isImage ? "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100" : "bg-blue-50 text-blue-500 group-hover:bg-blue-100"
                )}>
                  <Icon size={18} strokeWidth={2.5} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[13px] text-[#0f172a] font-semibold leading-tight truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] flex-shrink-0 tabular-nums font-medium whitespace-nowrap mt-0.5">
                      {file.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[12px] text-[#64748b] truncate group-hover:text-[#475569]">
                      {file.sender}
                    </span>
                    <span className="text-[10px] text-[#cbd5e1]">•</span>
                    <span className="text-[11px] text-[#94a3b8] font-medium flex-shrink-0">
                      {file.size}
                    </span>
                  </div>
                </div>
              </a>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-40 p-4 text-center mt-10">
            <span className="text-[#94a3b8] text-[13px]">No files uploaded yet.</span>
          </div>
        )}
      </div>
    </div>
  );
}
