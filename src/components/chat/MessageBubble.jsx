import clsx from 'clsx';
import { FileCard } from './FileCard';

export function MessageBubble({ message, isMe, tick, onViewFile }) {
  if (message.type === 'file') {
    const isImage = message.file?.type?.startsWith('image/');
    if (isImage && message.file?.url) {
      return (
        <div 
          onClick={() => onViewFile && onViewFile(message.file)}
          className={clsx(
            'mt-1 cursor-pointer overflow-hidden rounded-xl animate-slide-up hover:opacity-90 transition-opacity border',
            isMe ? 'border-[#4338ca] shadow-sm' : 'border-[#e2e8f0] shadow-sm'
          )}
        >
          <img 
            src={message.file.url} 
            alt={message.file.name} 
            className="max-w-[280px] max-h-[280px] object-cover block"
          />
        </div>
      );
    }
    return <FileCard file={message.file} isMe={isMe} onViewFile={onViewFile} />;
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
