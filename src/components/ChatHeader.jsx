import { useState, useEffect } from 'react';
import { Star, FolderOpen, MessageSquare, Search, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from './ui/Avatar';
import { ContactDetailsDrawer } from './chat/ContactDetailsDrawer';
import { useChat } from '../context/ChatContext';
import { supabase } from '../lib/supabase';

const TABS = [
  { id: 'chat',    icon: MessageSquare, label: 'Chat'    },
  { id: 'files',   icon: FolderOpen,    label: 'Files'   },
  { id: 'starred', icon: Star,          label: 'Starred' },
];

const STATUS_LABEL = { online: 'Active now', busy: 'Do not disturb', away: 'Away', offline: 'Offline' };
const STATUS_COLOR = { online: 'text-[#2eb67d]', busy: 'text-[#e01e5a]', away: 'text-[#ecb22e]', offline: 'text-[#94a3b8]' };

export function ChatHeader({ contact, activeTab, onTabChange }) {
  const [showDetails, setShowDetails] = useState(false);
  const { isSearchOpen, setIsSearchOpen, setActiveContact, onlineUsers } = useChat();
  const [lastSeen, setLastSeen] = useState(null);
  const [hrmsStatus, setHrmsStatus] = useState(null);

  useEffect(() => {
    if (!contact || contact.isChannel) return;

    let isMounted = true;
    async function fetchUserData() {
      try {
        const { data: user } = await supabase
          .from('company_users')
          .select('last_seen')
          .eq('id', contact.id)
          .single();
        
        if (isMounted && user?.last_seen) {
          setLastSeen(user.last_seen);
        }

        const { data: att } = await supabase
          .from('attendance')
          .select('status')
          .eq('company_user_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (isMounted && att && att.length > 0) {
          setHrmsStatus(att[0].status);
        } else if (isMounted) {
          setHrmsStatus('Not Clocked In');
        }
      } catch (err) {
        console.error("Error fetching presence/HRMS info:", err);
      }
    }

    fetchUserData();

    // Optionally set up realtime subscriptions for these tables here
    return () => { isMounted = false; };
  }, [contact]);

  if (!contact) return null;

  const isOnline = contact.isChannel ? false : (onlineUsers && onlineUsers[contact.id]);

  let displayStatus = '';
  if (contact.isChannel) {
    displayStatus = `${contact.name} · Channel`;
  } else if (isOnline) {
    displayStatus = 'Online';
  } else {
    if (lastSeen) {
       displayStatus = `Last seen at ${new Date(lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    } else {
       displayStatus = 'Offline';
    }
  }

  const getHrmsBadgeColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'clocked in': return 'bg-emerald-100 text-emerald-700';
      case 'clocked out': return 'bg-red-100 text-red-700';
      case 'on break': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="flex flex-col border-b border-[#e2e8f0] bg-white flex-shrink-0">
      {/* Top Info */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-2 hover:bg-[#f8fafc] transition-colors rounded-t-xl cursor-pointer">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button 
            className="md:hidden p-1 -ml-2 mr-1 text-[#64748b] hover:bg-[#e2e8f0] rounded-lg transition-colors flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setActiveContact(null);
            }}
          >
            <ChevronLeft size={22} />
          </button>
          
          <div 
            className="flex items-center gap-2 md:gap-3 min-w-0"
            onClick={() => setShowDetails(true)}
          >
        <Avatar
          initials={contact.initials}
          color={contact.color}
          status={contact.status}
          size="md"
          borderColor="#ffffff"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-[#0f172a] truncate leading-tight">
              {contact.name}
            </h2>
            {contact.role && (
              <>
                <span className="text-[#cbd5e1] text-[10px]">·</span>
                <span className="text-[12px] text-[#64748b] truncate hidden sm:block font-medium">{contact.role}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className={clsx('text-[11px] font-medium', isOnline ? 'text-[#2eb67d]' : 'text-[#94a3b8]')}>
              {displayStatus}
            </p>
            {!contact.isChannel && hrmsStatus && (
              <span className={clsx("px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider", getHrmsBadgeColor(hrmsStatus))}>
                {hrmsStatus}
              </span>
            )}
          </div>
        </div>
        </div>
        </div>
        
        <div className="flex items-center ml-2 md:ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSearchOpen(!isSearchOpen);
              if (!isSearchOpen && activeTab !== 'chat') {
                onTabChange('chat');
              }
            }}
            className={clsx(
              "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
              isSearchOpen ? "bg-[#eef2ff] text-[#4f46e5]" : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0]"
            )}
          >
            <Search size={17} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold border-b-[2px] transition-all duration-150 cursor-pointer',
              activeTab === id
                ? 'border-[#4f46e5] text-[#4f46e5]'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
            )}
          >
            <Icon size={14} strokeWidth={2.5} />
            {label}
          </button>
        ))}
      </div>

      <ContactDetailsDrawer 
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        contact={contact}
      />
    </div>
  );
}
