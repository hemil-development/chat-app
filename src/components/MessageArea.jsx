import { useRef, useEffect } from 'react';
import { Check, CheckCheck } from 'lucide-react';
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

export function MessageArea({ messages, contact, currentUser, contacts = [], typingUsers = [], onViewFile }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'auto' }); }, [messages]);

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
    <div className="flex-1 overflow-y-auto bg-white py-6">
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

                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isMe={isMe}
                      tick={tick}
                      onViewFile={onViewFile}
                    />
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

      <div ref={endRef} />
    </div>
  );
}
