import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

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
import { ForwardSidebar }   from '../components/chat/ForwardSidebar';

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
    chatAlert, setChatAlert,
    handleSend, handleFileUpload, handleSelect, sendTypingStatus,
    forwardingMessage
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

            {chatAlert && (
              <div className="absolute top-[72px] left-1/2 z-[90] w-full max-w-[400px] px-4 animate-slide-down-alert">
                {(() => {
                  const isSuccess = chatAlert.type === 'success';
                  const isInfo = chatAlert.type === 'info';
                  
                  let borderClass = 'border-[#ef4444]';
                  let iconColor = 'text-[#ef4444]';
                  let Icon = AlertCircle;
                  
                  if (isSuccess) {
                    borderClass = 'border-[#22c55e]';
                    iconColor = 'text-[#22c55e]';
                    Icon = CheckCircle2;
                  } else if (isInfo) {
                    borderClass = 'border-[#3b82f6]';
                    iconColor = 'text-[#3b82f6]';
                    Icon = Info;
                  }
                  
                  return (
                    <div className={`bg-white border-l-4 rounded-xl shadow-lg px-4 py-3 flex items-center justify-between gap-3 border border-y-[#e2e8f0] border-r-[#e2e8f0] ${borderClass}`}>
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={`${iconColor} shrink-0`} />
                        <span className="text-[13px] font-semibold text-[#0f172a]">{chatAlert.message}</span>
                      </div>
                      <button 
                        onClick={() => setChatAlert(null)}
                        className="text-[#94a3b8] hover:text-[#475569] transition-colors"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

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
                  onTyping={sendTypingStatus} 
                  contacts={contacts} 
                  onViewFile={setViewingFile}
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
      
      {/* Forward Message Sidebar */}
      {forwardingMessage && <ForwardSidebar />}

      {/* File Viewer Modal Overlay */}
      {viewingFile && <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />}
    </div>
  );
}
