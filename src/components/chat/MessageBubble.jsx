import clsx from 'clsx';
import { FileCard } from './FileCard';

export function MessageBubble({ message, isMe, tick }) {
  if (message.type === 'file') {
    return <FileCard file={message.file} isMe={isMe} />;
  }

  return (
    <div className={clsx(
      'relative px-4 pt-2 pb-5 text-[14px] leading-relaxed whitespace-pre-wrap break-words w-fit min-w-[80px] shadow-sm animate-slide-up',
      isMe
        ? 'bg-[#4f46e5] text-white rounded-2xl rounded-tr-sm self-end'
        : 'bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] rounded-2xl rounded-tl-sm self-start'
    )}>
      <div className="pb-0.5">{message.text}</div>
      <div className="absolute bottom-1 right-2.5 flex items-center gap-1 select-none pointer-events-none">
        <span className={clsx('text-[9px] tabular-nums font-semibold', isMe ? 'text-indigo-200/80' : 'text-slate-400')}>
          {message.timestamp}
        </span>
        {isMe && tick}
      </div>
    </div>
  );
}
