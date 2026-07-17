import { useRef, useEffect, useState, useMemo } from 'react';
import { Check, CheckCheck, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from './ui/Avatar';
import { DateDivider } from './chat/DateDivider';
import { MessageBubble } from './chat/MessageBubble';

function getDateLabel(isoString) {
  if (!isoString) return 'Today';
  const date = new Date(isoString);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function groupMessages(messages) {
  const groups = [];
  messages.forEach(msg => {
    const dateLabel = getDateLabel(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.senderId === msg.senderId && last.dateLabel === dateLabel) {
      last.items.push(msg);
    } else {
      groups.push({ senderId: msg.senderId, dateLabel, items: [msg] });
    }
  });
  return groups;
}

export function MessageArea({ messages, contact, currentUser, contacts = [], typingUsers = [], onViewFile, isSearchOpen, setIsSearchOpen }) {
  const endRef = useRef(null);
  const containerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  // Auto scroll to bottom when new messages arrive (if not searching)
  useEffect(() => { 
    if (!isSearchOpen && !searchQuery) {
      endRef.current?.scrollIntoView({ behavior: 'auto' }); 
    }
  }, [messages, isSearchOpen, searchQuery]);

  // Find matches
  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return messages.filter(m => {
      if (m.type === 'text' && m.text?.toLowerCase().includes(query)) return true;
      if (m.type === 'file' && m.file?.name?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [messages, searchQuery]);

  // Handle Match Navigation
  useEffect(() => {
    if (matches.length > 0) {
      setActiveMatchIndex(matches.length - 1); // Start at the most recent match
    } else {
      setActiveMatchIndex(0);
    }
  }, [matches]);

  useEffect(() => {
    if (matches.length > 0 && matches[activeMatchIndex]) {
      const matchId = matches[activeMatchIndex].id;
      const el = document.getElementById(`msg-${matchId}`);
      if (el && containerRef.current) {
        // Scroll the container so the element is roughly in the middle
        const container = containerRef.current;
        const offset = el.offsetTop - (container.clientHeight / 2);
        container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
      }
    }
  }, [activeMatchIndex, matches]);

  const handleNextMatch = () => {
    setActiveMatchIndex(prev => (prev < matches.length - 1 ? prev + 1 : 0));
  };

  const handlePrevMatch = () => {
    setActiveMatchIndex(prev => (prev > 0 ? prev - 1 : matches.length - 1));
  };

  const getSender = (senderId) => {
    if (senderId === 'me' || senderId === currentUser?.id) return currentUser;
    return contacts.find(c => c.id === senderId) ?? { name: 'Unknown', initials: '?', color: '#9ca3af' };
  };

  const isSeen = (msg) => {
    if (contact?.isChannel) return false;
    const readList = msg.readByUsers || [];
    return readList.some(item => {
      const parsed = typeof item === 'string' ? JSON.parse(item) : item;
      return parsed?.user_id === contact?.id;
    });
  };

  const groups = groupMessages(messages);

  let lastDateLabel = null;
  const groupsWithDivider = groups.map(group => {
    const showDivider = group.dateLabel !== lastDateLabel;
    if (showDivider) {
      lastDateLabel = group.dateLabel;
    }
    return {
      ...group,
      showDivider
    };
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white relative">
      {/* Inline Search Bar */}
      {isSearchOpen && (
        <div className="absolute top-0 left-0 right-0 bg-white border-b border-[#e2e8f0] z-10 px-4 py-2 flex items-center shadow-sm animate-fade-in">
          <Search size={16} className="text-[#94a3b8]" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in chat..."
            className="flex-1 ml-3 bg-transparent border-none outline-none text-[14px] text-[#0f172a] placeholder-[#94a3b8]"
          />
          {searchQuery && (
            <div className="flex items-center gap-2 mr-3 text-[12px] font-medium text-[#64748b]">
              <span>{matches.length > 0 ? activeMatchIndex + 1 : 0} / {matches.length}</span>
              <div className="flex items-center border border-[#e2e8f0] rounded-lg overflow-hidden bg-[#f8fafc]">
                <button 
                  onClick={handlePrevMatch} 
                  disabled={matches.length === 0}
                  className="p-1 hover:bg-[#e2e8f0] transition-colors disabled:opacity-50"
                >
                  <ChevronUp size={16} />
                </button>
                <div className="w-px h-4 bg-[#e2e8f0]" />
                <button 
                  onClick={handleNextMatch} 
                  disabled={matches.length === 0}
                  className="p-1 hover:bg-[#e2e8f0] transition-colors disabled:opacity-50"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          )}
          <button 
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            className="p-1.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-y-auto py-6">
        {groupsWithDivider.map((group, gi) => {
        const isMe = group.senderId === 'me' || group.senderId === currentUser?.id;
        const sender = getSender(group.senderId);

        return (
          <div key={gi}>
            {group.showDivider && <DateDivider label={group.dateLabel} />}
            <div className={clsx('flex gap-3 px-6 py-2 group transition-colors duration-150', isMe && 'flex-row-reverse')}>

              {/* Avatar - Only for incoming messages */}
              <div className={clsx('flex-shrink-0 w-8 self-start mt-0.5', isMe && 'hidden')}>
                <Avatar
                  initials={sender.initials}
                  color={sender.color}
                  size="sm"
                  borderColor="#ffffff"
                />
              </div>

              {/* Messages */}
              <div className={clsx('flex flex-col gap-1 w-full max-w-[70%]', isMe ? 'items-end' : 'items-start')}>
                {/* Header */}
                {!isMe && (
                  <div className="flex items-baseline gap-2 mb-0.5 ml-1">
                    <span className="text-[13px] font-bold text-[#0f172a]">{sender.name}</span>
                  </div>
                )}

                {/* Bubbles */}
                {group.items.map(msg => {
                  const seen = isSeen(msg);
                  const recipientOnline = contact?.status === 'online';
                  const tick = seen ? (
                    <CheckCheck size={14} className="text-[#38bdf8]" />
                  ) : recipientOnline ? (
                    <CheckCheck size={13} className="text-indigo-200/80" />
                  ) : (
                    <Check size={13} className="text-indigo-200/80" />
                  );

                  const isHighlighted = matches.length > 0 && matches[activeMatchIndex]?.id === msg.id;

                  return (
                    <div key={msg.id} id={`msg-${msg.id}`}>
                      <MessageBubble
                        message={msg}
                        isMe={isMe}
                        tick={tick}
                        onViewFile={onViewFile}
                        isHighlighted={isHighlighted}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <div className="flex items-end gap-3 px-6 py-2 animate-fade-in">
          <Avatar initials={typingUsers[0].initials} color={typingUsers[0].color} size="sm" borderColor="#ffffff" />
          <div className="flex items-center gap-1.5 px-4 py-3 bg-[#f1f5f9] border border-[#e2e8f0] rounded-2xl rounded-bl-sm w-fit shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8] animate-bounce-1" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8] animate-bounce-2" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8] animate-bounce-3" />
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
