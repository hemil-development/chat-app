import { useState, useEffect } from 'react';
import './index.css';

import { supabase }     from './lib/supabase';
import { Login }        from './components/Login';
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
import { currentUser, contacts, messages as initialMessages } from './data/mockData';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeNav,     setActiveNav]     = useState('chats');
  const [activeContact, setActiveContact] = useState(contacts[0]);
  const [activeTab,     setActiveTab]     = useState('chat');
  const [allMessages,   setAllMessages]   = useState(initialMessages);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8fafc]">
        <div className="w-8 h-8 rounded-full border-2 border-[#4f46e5] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

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
                <MessageArea 
                  messages={allMessages} 
                  contact={activeContact} 
                  currentUser={currentUser} 
                  contacts={contacts} 
                />
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
