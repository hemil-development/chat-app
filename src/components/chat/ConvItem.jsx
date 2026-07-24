import clsx from 'clsx';
import { Avatar } from '../ui/Avatar';

export function ConvItem({ contact: c, isActive, onClick }) {
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
      <div className="flex-1 min-w-0 ml-2">
        <div className="flex items-center justify-between gap-2">
          <span className={clsx(
            'text-[15px] truncate',
            isActive ? 'text-[#0f172a] font-semibold' : (c.unread > 0 ? 'text-[#0f172a] font-semibold' : 'text-[#334155] font-medium')
          )}>
            {c.name}
          </span>
          <span className="text-[11.5px] text-[#94a3b8] flex-shrink-0 tabular-nums font-medium">
            {c.timestamp}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className={clsx(
            'text-[13.5px] truncate leading-snug',
            c.unread > 0 && !isActive ? 'text-[#475569] font-medium' : 'text-[#64748b]'
          )}>
            {c.lastMessage}
          </p>
          {c.unread > 0 && (
            <span className="ubadge flex-shrink-0 border-2 border-[#f8fafc] group-hover:border-[#f1f5f9] mt-0.5">{c.unread}</span>
          )}
        </div>
      </div>
    </div>
  );
}
