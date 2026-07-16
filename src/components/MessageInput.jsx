import { useState, useRef } from 'react';
import { Paperclip, Smile, Send, AtSign, Mic, Bold, Italic } from 'lucide-react';

const EMOJIS = ['😊', '👍', '❤️', '🎉', '😂', '🙏', '🔥', '✅', '💯', '🚀', '👀', '🤔'];

export function MessageInput({ onSendMessage }) {
  const [text, setText]           = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef                  = useRef(null);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSendMessage(t);
    setText('');
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const addEmoji = (em) => {
    setText(p => p + em);
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="px-6 pb-6 pt-2 bg-white flex-shrink-0">
      <div className="msg-box">

        {/* Textarea */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={inputRef}
            placeholder="Message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            style={{ resize: 'none' }}
            className="w-full bg-transparent text-[14px] text-[#0f172a] placeholder:text-[#94a3b8]
                       outline-none leading-relaxed min-h-[24px] max-h-[120px] overflow-y-auto"
          />
        </div>

        {/* Toolbar row */}
        <div className="flex items-center justify-between px-2 pb-2 mt-1">
          {/* Left tools */}
          <div className="flex items-center gap-1">
            <ToolBtn icon={Bold}       title="Bold"   />
            <ToolBtn icon={Italic}     title="Italic" />
            <div className="w-px h-4 bg-[#e2e8f0] mx-1" />
            <ToolBtn icon={Paperclip}  title="Attach file" />
            <ToolBtn icon={AtSign}     title="Mention"     />
            <div className="relative">
              <ToolBtn
                icon={Smile}
                title="Emoji"
                onClick={() => setEmojiOpen(v => !v)}
                active={emojiOpen}
              />
              {emojiOpen && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white border border-[#e2e8f0]
                                rounded-xl shadow-lg grid grid-cols-6 gap-1 animate-scale-in z-50">
                  {EMOJIS.map(em => (
                    <button
                      key={em}
                      onClick={() => addEmoji(em)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-lg
                                 hover:bg-[#f1f5f9] transition-colors"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Send / Mic */}
          <div className="flex items-center gap-2 pr-1">
            {text.trim() ? (
              <button
                onClick={send}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-sm transition-all"
              >
                <Send size={15} strokeWidth={2.5} />
              </button>
            ) : (
              <button className="flex items-center justify-center w-8 h-8 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-all">
                <Mic size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ icon: Icon, title, onClick, active }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors
        ${active ? 'bg-[#f1f5f9] text-[#0f172a]' : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]'}`}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}
