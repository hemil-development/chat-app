import { useState } from 'react';
import './index.css';

import { Sidebar }      from './components/Sidebar';
import { ChatList }     from './components/ChatList';
import { ChatHeader }   from './components/ChatHeader';
import { MessageArea }  from './components/MessageArea';
import { MessageInput } from './components/MessageInput';
import { FilesPanel }   from './components/FilesPanel';
import { StarredPanel } from './components/StarredPanel';
import { contacts, messages as initialMessages } from './data/mockData';

/* ── Empty state ──────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] gap-5 select-none">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#e2e8f0] flex items-center justify-center shadow-sm">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4f46e5"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
      </div>

      <div className="text-center max-w-xs">
        <h2 className="text-lg font-bold text-[#0f172a] mb-1">Select a conversation</h2>
        <p className="text-[13px] text-[#64748b] leading-relaxed">
          Choose from your messages on the left to start chatting.
        </p>
      </div>
    </div>
  );
}

/* ── App ──────────────────────────────────────────────────── */
export default function App() {
  const [activeNav,     setActiveNav]     = useState('chats');
  const [activeContact, setActiveContact] = useState(contacts[0]);
  const [activeTab,     setActiveTab]     = useState('chat');
  const [allMessages,   setAllMessages]   = useState(initialMessages);

  const handleSend = (text) => {
    setAllMessages(prev => [
      ...prev,
      {
        id:        `m-${Date.now()}`,
        senderId:  'me',
        text,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type:      'text',
      },
    ]);
  };

  const handleSelect = (contact) => {
    setActiveContact(contact);
    setActiveTab('chat');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">

      {/* Sidebar */}
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />

      {/* Chat list */}
      <ChatList
        activeContactId={activeContact?.id}
        onSelectContact={handleSelect}
      />

      {/* Main area */}
      <main className="flex flex-col flex-1 min-w-0 h-screen bg-white relative">
        {activeContact ? (
          <>
            <ChatHeader
              contact={activeContact}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {activeTab === 'chat' && (
              <>
                <MessageArea messages={allMessages} contact={activeContact} />
                <MessageInput onSendMessage={handleSend} />
              </>
            )}

            {activeTab === 'files'   && <FilesPanel />}
            {activeTab === 'starred' && <StarredPanel />}
          </>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}
