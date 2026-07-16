import { useState } from 'react';
import './index.css';

import { Sidebar }      from './components/Sidebar';
import { ChatList }     from './components/ChatList';
import { ChatHeader }   from './components/ChatHeader';
import { MessageArea }  from './components/MessageArea';
import { MessageInput } from './components/MessageInput';
import { FilesPanel }   from './components/FilesPanel';
import { StarredPanel } from './components/StarredPanel';
import { EmptyState }       from './components/chat/EmptyState';
import { NotificationList } from './components/chat/NotificationList';
import { StarredSidebar }   from './components/chat/StarredSidebar';
import { FilesSidebar }     from './components/chat/FilesSidebar';
import { contacts, messages as initialMessages } from './data/mockData';

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

      {/* Left panel based on active navigation */}
      {activeNav === 'chats' && (
        <ChatList
          activeContactId={activeContact?.id}
          onSelectContact={handleSelect}
        />
      )}
      {activeNav === 'notifications' && <NotificationList />}
      {activeNav === 'starred' && <StarredSidebar />}
      {activeNav === 'files' && <FilesSidebar />}

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
          <EmptyState contacts={contacts} />
        )}
      </main>
    </div>
  );
}
