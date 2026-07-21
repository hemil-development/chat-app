import { Filter, SlidersHorizontal } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { supabase } from '../../lib/supabase';
import clsx from 'clsx';
import { useChat } from '../../context/ChatContext';

export function NotificationList({ notifications = [], onSelectChat, contacts = [] }) {
  const { markNotificationAsRead, markAllNotificationsAsRead } = useChat();
  const displayNotifications = notifications;

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      markNotificationAsRead(n.id);
    }
    
    if (!onSelectChat) return;
    
    // 1. Redirect using linkId if present (from database)
    if (n.linkId) {
      onSelectChat(n.linkId);
      return;
    }
    
    // 2. Otherwise fallback to matching colleague by name
    const queryName = n.name.toLowerCase();
    const match = contacts.find(c => c.name.toLowerCase().includes(queryName));
    if (match) {
      onSelectChat(match.id);
    }
  };

  return (
    <div className="flex flex-col w-full flex-shrink-0 h-full bg-transparent">
      {/* Header Area */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[#0f172a] font-bold text-[15px]">
            Notifications
          </span>
          <div className="flex items-center gap-1.5">
            {notifications.some(n => !n.isRead) && (
              <button 
                onClick={markAllNotificationsAsRead}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2 py-0.5 rounded transition-colors"
              >
                Mark all as read
              </button>
            )}
            <button className="flex items-center justify-center w-7 h-7 rounded-full text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] transition-colors">
              <Filter size={15} strokeWidth={2.5} />
            </button>
            <button className="flex items-center justify-center w-7 h-7 rounded-full text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] transition-colors">
              <SlidersHorizontal size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1 px-2 space-y-0.5">
        {displayNotifications.length > 0 ? (
          displayNotifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={clsx(
                "flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors group",
                n.isRead ? "hover:bg-[#f1f5f9]" : "bg-[#f1f5f9] hover:bg-[#e2e8f0]"
              )}
            >
              <div className="relative flex-shrink-0 mt-0.5">
                <Avatar initials={n.initial} color={n.color} size="sm" borderColor="#f8fafc" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border border-[#e2e8f0] rounded-full flex items-center justify-center text-[9px] shadow-sm">
                  {n.emoji}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12px] text-[#0f172a] font-semibold leading-tight line-clamp-1">
                    {n.name} {n.action}
                  </span>
                  <span className="text-[10px] text-[#94a3b8] flex-shrink-0 tabular-nums font-medium whitespace-nowrap">
                    {n.time}
                  </span>
                </div>
                {n.preview && (
                  <p className="text-[12px] text-[#64748b] truncate mt-0.5 group-hover:text-[#475569]">
                    {n.preview}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-40 p-4 text-center mt-10">
            <span className="text-[#94a3b8] text-[13px]">No notifications yet.</span>
          </div>
        )}
      </div>
    </div>
  );
}
