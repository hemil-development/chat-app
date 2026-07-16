import { useRef, useEffect } from 'react';
import { CheckCheck } from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from './ui/Avatar';
import { DateDivider } from './chat/DateDivider';
import { MessageBubble } from './chat/MessageBubble';
import { currentUser, contacts } from '../data/mockData';

function getSender(senderId) {
  if (senderId === 'me') return currentUser;
  return contacts.find(c => c.id === senderId) ?? { name: 'Unknown', initials: '?', color: '#9ca3af' };
}

function groupMessages(messages) {
  const groups = [];
  messages.forEach(msg => {
    const last = groups[groups.length - 1];
    if (last && last.senderId === msg.senderId) {
      last.items.push(msg);
    } else {
      groups.push({ senderId: msg.senderId, items: [msg] });
    }
  });
  return groups;
}

export function MessageArea({ messages, contact }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const groups = groupMessages(messages);

  return (
    <div className="flex-1 overflow-y-auto bg-white py-6">
      <DateDivider label="Today" />

      {groups.map((group, gi) => {
        const isMe = group.senderId === 'me';
        const sender = getSender(group.senderId);

        return (
          <div key={gi} className={clsx('flex gap-3 px-6 py-2 group transition-colors duration-150', isMe && 'flex-row-reverse')}>

            {/* Avatar - Only for incoming messages */}
            <div className={clsx('flex-shrink-0 w-8 mt-auto', isMe && 'hidden')}>
              <Avatar
                initials={sender.initials}
                color={sender.color}
                size="sm"
                borderColor="#ffffff"
              />
            </div>

            {/* Messages */}
            <div className={clsx('flex flex-col gap-1 w-full max-w-[70%]', isMe && 'items-end')}>
              {/* Header */}
              {!isMe && (
                <div className="flex items-baseline gap-2 mb-0.5 ml-1">
                  <span className="text-[12px] font-bold text-[#64748b]">{sender.name}</span>
                </div>
              )}

              {/* Bubbles */}
              {group.items.map(msg => (
                <MessageBubble key={msg.id} message={msg} isMe={isMe} />
              ))}
              
              {/* Timestamp below the group */}
              <div className={clsx('flex items-center gap-1 mt-0.5', isMe ? 'pr-1' : 'pl-1')}>
                 <span className="text-[10px] text-[#94a3b8] font-medium tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                  {group.items[group.items.length - 1].timestamp}
                </span>
                {isMe && <CheckCheck size={12} className="text-[#6366f1] opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {contact && (
        <div className="flex items-end gap-3 px-6 py-2 animate-fade-in">
          <Avatar initials={contact.initials} color={contact.color} size="sm" borderColor="#ffffff" />
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
