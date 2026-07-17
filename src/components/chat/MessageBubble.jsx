import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { FileCard } from './FileCard';
import { Smile, ChevronLeft, ChevronRight, MoreVertical, Pencil, Quote, Share2, Copy, Star, Trash2, CornerUpRight } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

const REACTION_PAGES = [
  [
    { emoji: '👍', name: 'Thumbs Up' },
    { emoji: '❤️', name: 'Heart' },
    { emoji: '👏', name: 'Clap' },
    { emoji: '✔️', name: 'Yes' },
    { emoji: '😃', name: 'Smile' },
    { emoji: '❌', name: 'No' },
  ],
  [
    { emoji: '🎉', name: 'Party' },
    { emoji: '🙏', name: 'Pray' },
    { emoji: '👎', name: 'Thumbs Down' },
    { emoji: '😔', name: 'Sad' },
    { emoji: '😠', name: 'Angry' },
    { emoji: '🔥', name: 'Fire' },
  ]
];

function renderMessageText(text) {
  if (!text) return '';

  // 1. Escape raw string characters first to prevent XSS injection
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Parse blockquotes (lines starting with &gt; )
  const lines = escaped.split('\n');
  const processedLines = [];
  let inQuote = false;
  let quoteLines = [];

  for (let line of lines) {
    if (line.startsWith('&gt; ')) {
      if (!inQuote) {
        inQuote = true;
      }
      quoteLines.push(line.substring(5)); // Remove "&gt; "
    } else {
      if (inQuote) {
        processedLines.push(`<blockquote class="border-l-4 border-slate-300 pl-3 py-1 my-1 bg-slate-50/80 rounded text-slate-500 italic text-[12px] whitespace-pre-wrap">${quoteLines.join('<br/>')}</blockquote>`);
        inQuote = false;
        quoteLines = [];
      }
      processedLines.push(line);
    }
  }
  if (inQuote) {
    processedLines.push(`<blockquote class="border-l-4 border-slate-300 pl-3 py-1 my-1 bg-slate-50/80 rounded text-slate-500 italic text-[12px] whitespace-pre-wrap">${quoteLines.join('<br/>')}</blockquote>`);
  }
  escaped = processedLines.join('\n');

  // 3. Parse the formatted content with boundary-safe Regex expressions sequentially
  const boldRegex = /(?<!\w)\*(\S(?:.*?\S)?)\*(?!\w)/g;
  const italicRegex = /(?<!\w)_(\S(?:.*?\S)?)_(?!\w)/g;

  escaped = escaped
    .replace(boldRegex, '<strong>$1</strong>')
    .replace(italicRegex, '<em>$1</em>');

  return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
}

export function MessageBubble({ message, isMe, tick, onViewFile, isHighlighted }) {
  const {
    companyUserId,
    handleToggleReaction,
    setEditingMessage,
    setQuoteMessage,
    handleToggleStar,
    handleDeleteMessage,
    setChatAlert,
    contacts,
    setForwardingMessage
  } = useChat();

  const [showPopover, setShowPopover] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [page, setPage] = useState(0);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const [menuDirection, setMenuDirection] = useState('down'); // 'up' or 'down'

  // Close context menu and reactions popover when clicking anywhere else or scrolling
  useEffect(() => {
    if (!showMenu && !showPopover) return;
    const handleOutsideAction = () => {
      setShowMenu(false);
      setShowPopover(false);
    };
    document.addEventListener('click', handleOutsideAction);
    window.addEventListener('scroll', handleOutsideAction, true);
    return () => {
      document.removeEventListener('click', handleOutsideAction);
      window.removeEventListener('scroll', handleOutsideAction, true);
    };
  }, [showMenu, showPopover]);

  // Time constraint: can edit only within 5 minutes of sending
  const timeDiffMinutes = (new Date() - new Date(message.createdAt)) / 60000;
  const canEdit = isMe && (timeDiffMinutes < 5) && (message.type !== 'file');

  if (message.isDeleted) {
    return (
      <div className={clsx("relative flex items-center gap-2 group/bubble max-w-full", isMe ? "self-end" : "self-start")}>
        <div className={clsx(
          'relative px-4 py-2 text-[13px] leading-relaxed italic text-slate-400 select-none shadow-sm rounded-2xl border bg-slate-50 border-slate-100 transition-all',
          isMe ? 'rounded-tr-sm self-end' : 'rounded-tl-sm self-start',
          isHighlighted && 'ring-2 ring-[#f59e0b] ring-offset-1 ring-offset-white'
        )}>
          This message was deleted.
        </div>
      </div>
    );
  }

  const rawReactions = message.reactions || [];
  const reactionsMap = {};
  rawReactions.forEach(r => {
    const parsed = typeof r === 'string' ? JSON.parse(r) : r;
    if (parsed?.reaction) {
      if (!reactionsMap[parsed.reaction]) {
        reactionsMap[parsed.reaction] = { count: 0, userIds: [] };
      }
      reactionsMap[parsed.reaction].count += 1;
      reactionsMap[parsed.reaction].userIds.push(parsed.user_id);
    }
  });

  const parsedReactions = Object.keys(reactionsMap).map(emoji => ({
    emoji,
    count: reactionsMap[emoji].count,
    hasReacted: reactionsMap[emoji].userIds.includes(companyUserId),
  }));

  let bubbleContent = null;
  if (message.type === 'file') {
    const isImage = message.file?.type?.startsWith('image/');
    if (isImage && message.file?.url) {
      bubbleContent = (
        <div className="flex flex-col items-start gap-1">
          {message.isForwarded && (
            <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mb-1 pl-1 select-none">
              <CornerUpRight size={11} strokeWidth={2.5} />
              <span>Forwarded</span>
            </div>
          )}
          <div
            onClick={() => onViewFile && onViewFile(message.file)}
            className={clsx(
              'mt-1 cursor-pointer overflow-hidden rounded-xl animate-slide-up hover:opacity-90 transition-all border w-fit',
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
          {parsedReactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 pl-1">
              {parsedReactions.map(r => (
                <button
                  key={r.emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleReaction(message.id, r.emoji);
                  }}
                  className={clsx(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-all border shadow-xs select-none",
                    r.hasReacted
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                  )}
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && <span>{r.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      bubbleContent = (
        <div className="flex flex-col items-start gap-1">
          {message.isForwarded && (
            <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mb-1 pl-1 select-none">
              <CornerUpRight size={11} strokeWidth={2.5} />
              <span>Forwarded</span>
            </div>
          )}
          <div className={clsx("flex flex-col items-start gap-1 transition-all rounded-xl", isHighlighted && "ring-2 ring-[#f59e0b] ring-offset-1 ring-offset-white")}>
            <FileCard file={message.file} isMe={isMe} onViewFile={onViewFile} />
            {parsedReactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 pl-1">
                {parsedReactions.map(r => (
                  <button
                    key={r.emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleReaction(message.id, r.emoji);
                    }}
                    className={clsx(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-all border shadow-xs select-none",
                      r.hasReacted
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    <span>{r.emoji}</span>
                    {r.count > 1 && <span>{r.count}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  } else {
    bubbleContent = (
      <div className={clsx(
        'relative px-4 pt-2 pb-5 text-[14px] leading-relaxed whitespace-pre-wrap break-words w-fit min-w-[80px] shadow-sm animate-slide-up flex flex-col transition-all',
        isMe
          ? 'bg-[#4f46e5] text-white rounded-2xl rounded-tr-sm self-end'
          : 'bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] rounded-2xl rounded-tl-sm self-start',
        isHighlighted && 'ring-2 ring-[#f59e0b] ring-offset-1 ring-offset-white'
      )}>
        {message.isForwarded && (
          <div className={clsx(
            "text-[10px] font-semibold flex items-center gap-1 mb-1.5 select-none",
            isMe ? "text-indigo-200/80" : "text-slate-400"
          )}>
            <CornerUpRight size={11} strokeWidth={2.5} />
            <span>Forwarded</span>
          </div>
        )}
        <div className="pb-0.5">{renderMessageText(message.text)}</div>

        {parsedReactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 pb-1">
            {parsedReactions.map(r => (
              <button
                key={r.emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleReaction(message.id, r.emoji);
                }}
                className={clsx(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-all border shadow-xs select-none",
                  r.hasReacted
                    ? "bg-indigo-50/20 border-indigo-300/30 text-white"
                    : isMe
                      ? "bg-white/10 border-white/10 text-white/90 hover:bg-white/20"
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                )}
              >
                <span>{r.emoji}</span>
                {r.count > 1 && <span>{r.count}</span>}
              </button>
            ))}
          </div>
        )}

        <div className="absolute bottom-1 right-2.5 flex items-center gap-1 select-none pointer-events-none">
          <span className={clsx('text-[9px] tabular-nums font-semibold flex items-center gap-0.5', isMe ? 'text-indigo-200/80' : 'text-slate-400')}>
            {message.timestamp}
            {message.isStarred && (
              <Star size={9} className="text-amber-400 fill-amber-400 shrink-0 ml-0.5" />
            )}
          </span>
          {isMe && tick}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("relative flex items-center gap-2 group/bubble max-w-full", isMe ? "flex-row-reverse self-end" : "flex-row self-start")}>

      {bubbleContent}

      {/* Smiley Hover Reaction Trigger Button & Action Dropdown Trigger */}
      <div className={clsx(
        "relative transition-opacity flex-shrink-0 flex items-center gap-1 z-30",
        (showMenu || showPopover) ? "opacity-100" : "opacity-0 group-hover/bubble:opacity-100"
      )}>

        {/* Smile Button */}
        {!isMe && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              if (!showPopover) {
                const rect = e.currentTarget.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const spaceBelow = windowHeight - rect.bottom;
                setMenuDirection(spaceBelow < 220 ? 'up' : 'down');
              }
              setShowPopover(v => !v);
            }}
            className={clsx(
              "w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-sm border bg-white",
              showPopover
                ? "border-indigo-200 text-[#007eff] hover:bg-indigo-50"
                : "border-[#e2e8f0] text-[#64748b] hover:text-[#007eff] hover:bg-[#f8fafc]"
            )}
          >
            <Smile size={13} strokeWidth={2.5} />
          </button>
        )}

        {/* Action Trigger Menu Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPopover(false);
              if (!showMenu) {
                const rect = e.currentTarget.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const spaceBelow = windowHeight - rect.bottom;
                setMenuDirection(spaceBelow < 220 ? 'up' : 'down');
              }
              setShowMenu(v => !v);
            }}
            className={clsx(
              "w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-sm border bg-white",
              showMenu
                ? "border-indigo-200 text-[#007eff] hover:bg-indigo-50"
                : "border-[#e2e8f0] text-[#64748b] hover:text-[#007eff] hover:bg-[#f8fafc]"
            )}
          >
            <MoreVertical size={13} strokeWidth={2.5} />
          </button>

          {/* Actions Dropdown Menu */}
          {showMenu && (
            <div className={clsx(
              "absolute z-50 bg-white border border-[#e2e8f0] rounded-xl shadow-lg py-1 w-[150px] animate-scale-in right-0",
              menuDirection === 'up' ? "bottom-full mb-1" : "top-full mt-1"
            )}>
              {canEdit && (
                <button
                  onClick={() => {
                    setEditingMessage(message);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-[12px] text-[#475569] hover:bg-slate-50 transition-colors font-medium"
                >
                  <Pencil size={12} className="text-slate-400" />
                  Edit
                </button>
              )}

              {message.type !== 'file' && (
                <button
                  onClick={() => {
                    setQuoteMessage(message);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-[12px] text-[#475569] hover:bg-slate-50 transition-colors font-medium"
                >
                  <Quote size={12} className="text-slate-400" />
                  Quote
                </button>
              )}

              <button
                onClick={() => {
                  setForwardingMessage(message);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-[12px] text-[#475569] hover:bg-slate-50 transition-colors font-medium"
              >
                <Share2 size={12} className="text-slate-400" />
                Forward
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.text || '');
                  setChatAlert({ type: 'success', message: 'Message copied to clipboard' });
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-[12px] text-[#475569] hover:bg-slate-50 transition-colors font-medium"
              >
                <Copy size={12} className="text-slate-400" />
                Copy
              </button>

              <button
                onClick={() => {
                  handleToggleStar(message.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-[12px] text-[#475569] hover:bg-slate-50 transition-colors font-medium"
              >
                <Star size={12} className={clsx(message.isStarred ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
                {message.isStarred ? 'Unstar Message' : 'Star Message'}
              </button>



              {isMe && (
                <button
                  onClick={() => {
                    handleDeleteMessage(message.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-[12px] text-[#ef4444] hover:bg-red-50/50 transition-colors font-semibold border-t border-slate-100 mt-0.5"
                >
                  <Trash2 size={12} className="text-[#ef4444]" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Smiley Popover React Emojis */}
        {showPopover && (
          <div className={clsx(
            "absolute left-1/2 -translate-x-1/2 z-50 bg-white border border-[#e2e8f0] rounded-xl shadow-lg p-1.5 flex flex-col items-center gap-1.5 animate-scale-in max-w-[280px] before:content-[''] before:absolute before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent",
            menuDirection === 'up'
              ? "bottom-full mb-1.5 before:top-full before:border-t-white"
              : "top-full mt-1.5 before:bottom-full before:border-b-white"
          )}>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPage(p => (p === 0 ? REACTION_PAGES.length - 1 : p - 1));
                }}
                className="p-1 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] transition-colors"
              >
                <ChevronLeft size={13} strokeWidth={2.5} />
              </button>

              <div className="flex items-center gap-0.5">
                {REACTION_PAGES[page].map(item => (
                  <div
                    key={item.emoji}
                    className="relative group"
                    onMouseEnter={() => setHoveredReaction(item.name)}
                    onMouseLeave={() => setHoveredReaction(null)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleReaction(message.id, item.emoji);
                        setShowPopover(false);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-base hover:scale-125 transition-transform"
                    >
                      {item.emoji}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPage(p => (p === REACTION_PAGES.length - 1 ? 0 : p + 1));
                }}
                className="p-1 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] transition-colors"
              >
                <ChevronRight size={13} strokeWidth={2.5} />
              </button>
            </div>

            {hoveredReaction && (
              <div className="bg-[#0f172a] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded shadow-sm leading-none animate-fade-in whitespace-nowrap">
                {hoveredReaction}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
