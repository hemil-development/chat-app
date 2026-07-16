import { useRef, useEffect } from 'react';
import { FileText, Download, ExternalLink, CheckCheck } from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from './Avatar';
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

const FILE_STYLE = {
  doc:  { bg: '#eff6ff', icon: '#3b82f6', border: '#bfdbfe', ext: 'DOCX' },
  docx: { bg: '#eff6ff', icon: '#3b82f6', border: '#bfdbfe', ext: 'DOCX' },
  pdf:  { bg: '#fef2f2', icon: '#ef4444', border: '#fecaca', ext: 'PDF'  },
  fig:  { bg: '#faf5ff', icon: '#a855f7', border: '#e9d5ff', ext: 'FIG'  },
  zip:  { bg: '#fffbeb', icon: '#f59e0b', border: '#fde68a', ext: 'ZIP'  },
};

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
              {/* Header (optional, usually omitted for classic bubbles, but let's keep it clean) */}
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

function DateDivider({ label }) {
  return (
    <div className="flex items-center gap-4 px-6 my-6">
      <div className="flex-1 h-px bg-[#e2e8f0]" />
      <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider px-3 py-1 rounded-full border border-[#e2e8f0] bg-white">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#e2e8f0]" />
    </div>
  );
}

function MessageBubble({ message, isMe }) {
  if (message.type === 'file') {
    return <FileCard file={message.file} timestamp={message.timestamp} isMe={isMe} />;
  }

  return (
    <div className={clsx(
      'px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words w-fit shadow-sm animate-slide-up',
      isMe 
        ? 'bg-[#4f46e5] text-white rounded-2xl rounded-tr-sm' 
        : 'bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] rounded-2xl rounded-tl-sm'
    )}>
      {message.text}
    </div>
  );
}

function FileCard({ file, timestamp, isMe }) {
  if (!file) return null;
  const ext = (file.name.split('.').pop() ?? 'doc').toLowerCase();
  const style = FILE_STYLE[ext] ?? FILE_STYLE.doc;

  return (
    <div className={clsx(
      'flex flex-col gap-2 p-3 mt-1 rounded-xl shadow-sm hover:shadow-md transition-shadow animate-slide-up max-w-[340px]',
      isMe 
        ? 'bg-[#4f46e5] border border-[#4338ca]' 
        : 'bg-white border border-[#e2e8f0]'
    )}>
      <div className="flex items-start gap-3">
        <div className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border',
          isMe ? 'bg-white/20 border-white/20' : ''
        )} style={!isMe ? { backgroundColor: style.bg, borderColor: style.border } : {}}>
          <FileText size={20} strokeWidth={2} style={!isMe ? { color: style.icon } : { color: '#ffffff' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={clsx(
            'text-[13px] font-semibold truncate leading-tight',
            isMe ? 'text-white' : 'text-[#0f172a]'
          )}>
            {file.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={clsx(
              'text-[10px] font-bold',
              isMe ? 'text-white/80' : 'text-[#64748b]'
            )}>{style.ext}</span>
            <span className={clsx('w-1 h-1 rounded-full', isMe ? 'bg-white/50' : 'bg-[#cbd5e1]')} />
            <span className={clsx('text-[11px]', isMe ? 'text-white/80' : 'text-[#64748b]')}>{file.size}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <button className={clsx(
            'w-7 h-7 flex items-center justify-center rounded-md transition-all',
            isMe ? 'text-white hover:bg-white/20' : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
          )}>
            <Download size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
