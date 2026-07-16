import { Filter, SlidersHorizontal } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

const MOCK_NOTIFICATIONS = [
  { id: 1, name: 'Parth', action: 'Reacted To Your Message', preview: 'Hu bija par karu chu', time: '01:06 PM', color: '#8b5cf6', initial: 'P', emoji: '👍' },
  { id: 2, name: 'Akash', action: '@Mentioned You:', preview: '@Sumit Pandya @Parth', time: '11:55 AM', color: '#3b82f6', initial: 'A', emoji: '@' },
  { id: 3, name: 'Akash', action: 'Reacted To Your Message', preview: '16/07/26', time: '10:32 AM', color: '#3b82f6', initial: 'A', emoji: '👍' },
  { id: 4, name: 'Akash', action: 'Reacted To Your Message', preview: 'I\'ve added both.', time: 'Yesterday', color: '#3b82f6', initial: 'A', emoji: '👍' },
  { id: 5, name: 'Akash', action: 'Reacted To Your Message', preview: 'Done', time: 'Yesterday', color: '#3b82f6', initial: 'A', emoji: '👍' },
  { id: 6, name: 'Akash', action: '@Mentioned You:', preview: 'Hello @Khushbu Desai @Sumit', time: 'Yesterday', color: '#3b82f6', initial: 'A', emoji: '@' },
  { id: 7, name: 'Rishi', action: 'Reacted To Your Message', preview: '', time: 'Yesterday', color: '#f59e0b', initial: 'R', emoji: '👍' },
  { id: 8, name: 'Huzefa', action: 'Reacted To Your Message', preview: 'Happy Birthday @Huzefa', time: 'Yesterday', color: '#10b981', initial: 'H', emoji: '😁' },
];

export function NotificationList({ notifications = [], onSelectChat, contacts = [] }) {
  const displayNotifications = notifications.length > 0 ? notifications : MOCK_NOTIFICATIONS;

  const handleNotificationClick = (n) => {
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
    <div className="flex flex-col w-[280px] flex-shrink-0 bg-[#f8fafc] h-screen border-r border-[#e2e8f0]">
      {/* Header Area */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[#0f172a] font-bold text-[15px]">
            Notifications
          </span>
          <div className="flex items-center gap-1">
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
        {displayNotifications.map(n => (
          <div
            key={n.id}
            onClick={() => handleNotificationClick(n)}
            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#f1f5f9] cursor-pointer transition-colors group"
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
        ))}
      </div>
    </div>
  );
}
