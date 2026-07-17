import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

import { Sidebar }      from '../components/Sidebar';
import { ChatList }     from '../components/ChatList';
import { ChatHeader }   from '../components/ChatHeader';
import { MessageArea }  from '../components/MessageArea';
import { MessageInput } from '../components/MessageInput';
import { FilesPanel }   from '../components/FilesPanel';
import { StarredPanel } from '../components/StarredPanel';
import { EmptyState }       from '../components/chat/EmptyState';
import { NotificationList } from '../components/chat/NotificationList';
import { StarredSidebar }   from '../components/chat/StarredSidebar';
import { FilesSidebar }     from '../components/chat/FilesSidebar';
import { FileViewer }       from '../components/chat/FileViewer';
import { Login }            from '../components/Login';

export function MainLayout() {
  const { session, authLoading } = useAuth();
  
  const {
    activeNav, setActiveNav,
    contacts, 
    activeContact, 
    activeTab, setActiveTab,
    allMessages,
    loading,
    notifications, 
    viewingFile, setViewingFile,
    currentUser, currentContact,
    activeRoomTypingUsers,
    handleSend, handleFileUpload, handleSelect, sendTypingStatus
  } = useChat();

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <span className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
        <p className="text-sm font-semibold text-slate-500 font-medium animate-pulse">Initializing chat session...</p>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        currentUser={currentUser}
        unreadNotifications={notifications.length > 0 ? notifications.filter(n => !n.isRead).length : undefined}
      />

      {/* Left panel based on active navigation */}
      {activeNav === 'chats' && (
        <ChatList
          contacts={contacts}
          activeContactId={activeContact?.id}
          onSelectContact={handleSelect}
        />
      )}
      {activeNav === 'notifications' && (
        <NotificationList
          notifications={notifications}
          contacts={contacts}
          onSelectChat={(contactId) => {
            const target = contacts.find(c => c.id === contactId || c.roomId === contactId);
            if (target) {
              handleSelect(target);
            }
          }}
        />
      )}
      {activeNav === 'starred' && <StarredSidebar />}
      {activeNav === 'files' && <FilesSidebar />}

      {/* Main area */}
      <main className="flex flex-col flex-1 min-w-0 h-screen bg-white relative">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-3">
            <span className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            <p className="text-sm font-semibold text-slate-500">Loading chat rooms...</p>
          </div>
        ) : currentContact ? (
          <>
            <ChatHeader
              contact={currentContact}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {activeTab === 'chat' && (
              <>
                <MessageArea
                  messages={allMessages}
                  contact={currentContact}
                  currentUser={currentUser}
                  contacts={contacts}
                  typingUsers={activeRoomTypingUsers}
                  onViewFile={setViewingFile}
                />
                <MessageInput 
                  onSendMessage={handleSend} 
                  onFileUpload={handleFileUpload}
                  onTyping={sendTypingStatus} 
                  contacts={contacts} 
                />
              </>
            )}

            {activeTab === 'files'   && <FilesPanel />}
            {activeTab === 'starred' && <StarredPanel />}
          </>
        ) : (
          <EmptyState contacts={contacts} />
        )}
      </main>
      
      {viewingFile && (
        <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />
      )}
    </div>
  );
}
