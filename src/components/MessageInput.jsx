import { useState, useRef } from 'react';
import { Paperclip, Smile, Send, AtSign, Mic, Bold, Italic } from 'lucide-react';
import { IconButton } from './ui/IconButton';
import { Avatar } from './ui/Avatar';
import clsx from 'clsx';

import EmojiPicker from 'emoji-picker-react';

const getMentionQuery = (val, cursorIdx) => {
  const textBeforeCursor = val.substring(0, cursorIdx);
  const lastAtIdx = textBeforeCursor.lastIndexOf('@');
  
  if (lastAtIdx === -1) return null;
  
  const isStart = lastAtIdx === 0 || /\s/.test(textBeforeCursor[lastAtIdx - 1]);
  if (!isStart) return null;
  
  const query = textBeforeCursor.substring(lastAtIdx + 1);
  if (/\s/.test(query)) return null;
  
  return { query, index: lastAtIdx };
};

export function MessageInput({ onSendMessage, onTyping, onFileUpload, contacts = [] }) {
  const [text, setText]           = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef                  = useRef(null);
  const fileInputRef              = useRef(null);
  const typingTimeoutRef          = useRef(null);
  const [isTyping, setIsTyping]   = useState(false);

  const [mentionState, setMentionState] = useState(null); // { query: string, index: number }
  const [highlightIdx, setHighlightIdx] = useState(0);

  const mentionContacts = (contacts || []).filter(c => !c.isChannel);
  const filteredMentions = mentionState 
    ? mentionContacts.filter(c => c.name.toLowerCase().includes(mentionState.query.toLowerCase()))
    : [];

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSendMessage(t);
    setText('');
    setEmojiOpen(false);
    setMentionState(null);
    
    if (onTyping) onTyping(false);
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    inputRef.current?.focus();
  };

  const insertMention = (user) => {
    if (!mentionState) return;
    const before = text.substring(0, mentionState.index);
    const after = text.substring(inputRef.current.selectionEnd);
    const newText = `${before}@${user.name} ${after}`;
    
    setText(newText);
    setMentionState(null);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const cursorPosition = before.length + user.name.length + 2; // @ and space
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  const triggerAtSymbol = () => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart;
    const before = text.substring(0, start);
    const after = text.substring(inputRef.current.selectionEnd);
    const newText = before + '@' + after;
    
    setText(newText);
    setMentionState({ query: '', index: start });
    setHighlightIdx(0);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(start + 1, start + 1);
      }
    }, 10);
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    
    const cursor = e.target.selectionStart;
    const queryInfo = getMentionQuery(val, cursor);
    if (queryInfo) {
      setMentionState(queryInfo);
      setHighlightIdx(0);
    } else {
      setMentionState(null);
    }

    if (onTyping) {
      if (!isTyping) {
        setIsTyping(true);
        onTyping(true);
      }
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 3000);
    }
  };

  const onKey = (e) => {
    if (mentionState && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx(prev => (prev + 1) % filteredMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMentions[highlightIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionState(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      send(); 
    }
  };

  const addEmoji = (em) => {
    setText(p => p + em);
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    // Clear input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="px-6 pb-6 pt-2 bg-white flex-shrink-0">
      <div className="msg-box relative">

        {/* Mentions Dropdown */}
        {mentionState && filteredMentions.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 w-[240px] bg-white border border-[#e2e8f0]
                          rounded-xl shadow-lg overflow-y-auto max-h-[200px] z-50 py-1 animate-scale-in">
            {filteredMentions.map((user, idx) => (
              <div
                key={user.id}
                onMouseEnter={() => setHighlightIdx(idx)}
                onClick={() => insertMention(user)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-[13px] font-medium",
                  idx === highlightIdx ? "bg-[#f1f5f9] text-[#0f172a]" : "text-[#475569] hover:bg-[#f8fafc]"
                )}
              >
                <Avatar initials={user.initials} color={user.color} size="xs" borderColor="#ffffff" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">{user.name}</p>
                  <p className="text-[10px] text-[#94a3b8] truncate leading-none mt-0.5">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={inputRef}
            placeholder="Message..."
            value={text}
            onChange={handleTextChange}
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
            <IconButton icon={Bold}       title="Bold"   />
            <IconButton icon={Italic}     title="Italic" />
            <div className="w-px h-4 bg-[#e2e8f0] mx-1" />
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
            />
            <IconButton icon={Paperclip}  title="Attach file" onClick={() => fileInputRef.current?.click()} />
            <IconButton icon={AtSign}     title="Mention"  onClick={triggerAtSymbol} />
            <div className="relative">
              <IconButton
                icon={Smile}
                title="Emoji"
                onClick={() => setEmojiOpen(v => !v)}
                active={emojiOpen}
              />
              {emojiOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => addEmoji(emojiData.emoji)}
                    autoFocusSearch={false}
                    theme="light"
                    width={320}
                    height={400}
                  />
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
