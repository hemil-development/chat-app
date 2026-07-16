import { useState } from 'react';
import { Search, Edit } from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from './Avatar';
import { contacts } from '../data/mockData';

const TABS = [
  { id: 'all',      label: 'All'      },
  { id: 'unread',   label: 'Unread'   },
  { id: 'channels', label: 'Channels' },
];

export function ChatList({ activeContactId, onSelectContact }) {
  const [activeTab, setActiveTab]     = useState('all');
  const [query, setQuery]             = useState('');

  const filtered = contacts.filter(c => {
    const hit = c.name.toLowerCase().includes(query.toLowerCase());
    if (!hit) return false;
    if (activeTab === 'unread')   return c.unread > 0;
    if (activeTab === 'channels') return c.isChannel;
    return true;
  });

  return (
    <div className="flex flex-col w-[280px] flex-shrink-0 bg-[#f8fafc] h-screen border-r border-[#e2e8f0]">

      {/* Header Area */}
      <div className="px-4 pt-4 pb-2">
        {/* Title & Action */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[#0f172a] font-bold text-[15px]">
            Messages
          </span>
          <button className="flex items-center justify-center w-7 h-7 rounded-full text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] transition-colors">
            <Edit size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-[#e2e8f0]
                        rounded-md px-2.5 py-1.5 shadow-sm focus-within:border-[#4f46e5] focus-within:ring-1 focus-within:ring-[#4f46e5] transition-all mb-3">
          <Search size={13} className="text-[#94a3b8] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-[#0f172a] placeholder:text-[#94a3b8]
                       outline-none min-w-0"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#e2e8f0] p-0.5 rounded-lg">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={clsx(
                'flex-1 py-1 rounded-md text-[11px] font-semibold transition-all duration-150',
                activeTab === t.id
                  ? 'bg-white text-[#0f172a] shadow-sm'
                  : 'text-[#64748b] hover:text-[#475569]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <Search size={24} className="text-[#cbd5e1] mb-3" />
            <p className="text-[13px] text-[#64748b] font-medium">No results found</p>
          </div>
        )}

        {filtered.map(c => (
          <ConvItem
            key={c.id}
            contact={c}
            isActive={c.id === activeContactId}
            onClick={() => onSelectContact(c)}
          />
        ))}
      </div>
    </div>
  );
}

function ConvItem({ contact: c, isActive, onClick }) {
  return (
    <div onClick={onClick} className={clsx('conv-item group', isActive && 'active')}>
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          initials={c.initials}
          color={c.color}
          status={c.isChannel ? null : c.status}
          size="sm"
          borderColor={isActive ? '#f1f5f9' : '#f8fafc'}
        />
        {c.isChannel && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-white
                           border border-[#e2e8f0] rounded-full flex items-center justify-center">
            <span className="text-[9px] text-[#64748b] font-bold">#</span>
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 ml-1">
        <div className="flex items-center justify-between gap-2">
          <span className={clsx(
            'text-[13px] truncate',
            isActive ? 'text-[#0f172a] font-semibold' : (c.unread > 0 ? 'text-[#0f172a] font-semibold' : 'text-[#334155] font-medium')
          )}>
            {c.name}
          </span>
          <span className="text-[10px] text-[#94a3b8] flex-shrink-0 tabular-nums font-medium">
            {c.timestamp}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 mt-[2px]">
          <p className={clsx(
            'text-[12px] truncate leading-tight',
            c.unread > 0 && !isActive ? 'text-[#475569] font-medium' : 'text-[#64748b]'
          )}>
            {c.lastMessage}
          </p>
          {c.unread > 0 && (
            <span className="ubadge flex-shrink-0 border-2 border-[#f8fafc] group-hover:border-[#f1f5f9]">{c.unread}</span>
          )}
        </div>
      </div>
    </div>
  );
}
