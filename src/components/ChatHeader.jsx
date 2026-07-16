import { Star, FolderOpen, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from './Avatar';

const TABS = [
  { id: 'chat',    icon: MessageSquare, label: 'Chat'    },
  { id: 'files',   icon: FolderOpen,    label: 'Files'   },
  { id: 'starred', icon: Star,          label: 'Starred' },
];

const STATUS_LABEL = { online: 'Active now', busy: 'Do not disturb', away: 'Away', offline: 'Offline' };
const STATUS_COLOR = { online: 'text-[#2eb67d]', busy: 'text-[#e01e5a]', away: 'text-[#ecb22e]', offline: 'text-[#94a3b8]' };

export function ChatHeader({ contact, activeTab, onTabChange }) {
  if (!contact) return null;

  return (
    <div className="flex flex-col border-b border-[#e2e8f0] bg-white flex-shrink-0">
      {/* Top Info */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-2">
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
          <p className={clsx('text-[11px] font-medium mt-0.5', STATUS_COLOR[contact.status] ?? 'text-[#94a3b8]')}>
            {contact.isChannel
              ? `${contact.name} · Channel`
              : (contact.lastSeen || STATUS_LABEL[contact.status])}
          </p>
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
    </div>
  );
}
