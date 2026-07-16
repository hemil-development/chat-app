import clsx from 'clsx';
import { FileCard } from './FileCard';

export function MessageBubble({ message, isMe }) {
  if (message.type === 'file') {
    return <FileCard file={message.file} isMe={isMe} />;
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
