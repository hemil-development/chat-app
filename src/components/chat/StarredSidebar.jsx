import { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useChat } from '../../context/ChatContext';
import { supabase } from '../../lib/supabase';
import { formatMessageTime, getUserColor } from '../../utils/helpers';

export function StarredSidebar() {
  const { companyUserId, contacts, handleSelect, setScrollToMessageId } = useChat();
  const [starred, setStarred] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyUserId) return;
    const fetchStarred = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*, company_users!chat_messages_created_by_fkey(users(first_name, last_name))')
          .filter('star_by_users', 'cs', `[{"user_id":"${companyUserId}"}]`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map(m => {
          let preview = m.message;
          if (m.type === 'file') {
            try {
              const meta = JSON.parse(m.message);
              preview = meta.name || 'a file';
            } catch(e) { preview = 'a file'; }
          }
          const fname = m.company_users?.users?.first_name || 'Someone';
          const lname = m.company_users?.users?.last_name || '';
          return {
            id: m.id,
            roomId: m.room_id,
            name: `${fname} ${lname}`.trim(),
            preview: preview,
            date: formatMessageTime(m.created_at),
            initial: `${fname?.[0] || '?'}${lname?.[0] || ''}`.toUpperCase(),
            color: getUserColor(m.created_by)
          };
        });
        setStarred(formatted);
      } catch (err) {
        console.error("Error fetching starred messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStarred();
  }, [companyUserId]);

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
        {loading ? (
          <div className="flex-1 flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 text-[#94a3b8] animate-spin" />
          </div>
        ) : starred.length > 0 ? (
          starred.map(item => (
            <div 
              key={item.id} 
              onClick={() => {
                const contact = contacts.find(c => c.roomId === item.roomId);
                if (contact) {
                  handleSelect(contact);
                  setScrollToMessageId(item.id);
                }
              }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f1f5f9] cursor-pointer transition-colors group"
            >
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
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-40 p-4 text-center mt-10">
            <span className="text-[#94a3b8] text-[13px]">No starred messages yet.</span>
          </div>
        )}
      </div>
    </div>
  );
}
