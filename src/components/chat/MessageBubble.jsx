import clsx from 'clsx';
import { FileCard } from './FileCard';

function renderMessageText(text) {
  if (!text) return '';

  // 1. Escape raw string characters first to prevent XSS injection
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Parse the formatted content with boundary-safe Regex expressions sequentially
  // Bold regex runs first, followed by the italic regex
  const boldRegex = /(?<!\w)\*(\S(?:.*?\S)?)\*(?!\w)/g;
  const italicRegex = /(?<!\w)_(\S(?:.*?\S)?)_(?!\w)/g;

  escaped = escaped
    .replace(boldRegex, '<strong>$1</strong>')
    .replace(italicRegex, '<em>$1</em>');

  return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
}

export function MessageBubble({ message, isMe, tick, onViewFile, isHighlighted }) {
  if (message.type === 'file') {
    const isImage = message.file?.type?.startsWith('image/');
    if (isImage && message.file?.url) {
      return (
        <div 
          onClick={() => onViewFile && onViewFile(message.file)}
          className={clsx(
            'mt-1 cursor-pointer overflow-hidden rounded-xl animate-slide-up hover:opacity-90 transition-all border',
            isMe ? 'border-[#4338ca] shadow-sm' : 'border-[#e2e8f0] shadow-sm',
            isHighlighted && 'ring-2 ring-[#f59e0b] ring-offset-1 ring-offset-white'
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
    return (
      <div className={clsx("transition-all rounded-xl", isHighlighted && "ring-2 ring-[#f59e0b] ring-offset-1 ring-offset-white")}>
        <FileCard file={message.file} isMe={isMe} onViewFile={onViewFile} />
      </div>
    );
  }

  return (
    <div className={clsx(
      'relative px-4 pt-2 pb-5 text-[14px] leading-relaxed whitespace-pre-wrap break-words w-fit min-w-[80px] shadow-sm animate-slide-up transition-all',
      isMe
        ? 'bg-[#4f46e5] text-white rounded-2xl rounded-tr-sm self-end'
        : 'bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] rounded-2xl rounded-tl-sm self-start',
      isHighlighted && 'ring-2 ring-[#f59e0b] ring-offset-1 ring-offset-white'
    )}>
      <div className="pb-0.5">{renderMessageText(message.text)}</div>
      <div className="absolute bottom-1 right-2.5 flex items-center gap-1 select-none pointer-events-none">
        <span className={clsx('text-[9px] tabular-nums font-semibold', isMe ? 'text-indigo-200/80' : 'text-slate-400')}>
          {message.timestamp}
        </span>
        {isMe && tick}
      </div>
    </div>
  );
}
