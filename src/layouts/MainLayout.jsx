import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import clsx from 'clsx';

import { Sidebar } from '../components/Sidebar';
import { ChatList } from '../components/ChatList';
import { ChatHeader } from '../components/ChatHeader';
import { MessageArea } from '../components/MessageArea';
import { MessageInput } from '../components/MessageInput';
import { FilesPanel } from '../components/FilesPanel';
import { StarredPanel } from '../components/StarredPanel';
import { SearchPanel } from '../components/SearchPanel';
import { EmptyState } from '../components/chat/EmptyState';
import { NotificationList } from '../components/chat/NotificationList';
import { StarredSidebar } from '../components/chat/StarredSidebar';
import { FilesSidebar } from '../components/chat/FilesSidebar';
import { FileViewer } from '../components/chat/FileViewer';
import { Login } from '../components/Login';
import { ForwardSidebar } from '../components/chat/ForwardSidebar';

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
    isSearchOpen, setIsSearchOpen,
    handleSend, handleFileUpload, handleSelect, sendTypingStatus,
    forwardingMessage
  } = useChat();

  if (authLoading) {
    return (
      <div className="flex flex-col-reverse md:flex-row h-[100dvh] w-full overflow-hidden bg-white animate-pulse">
        {/* Mobile Nav / Sidebar Skeleton */}
        <aside className="flex flex-row md:flex-col items-center justify-between md:justify-start 
                          w-full h-[60px] md:w-[64px] md:h-[100dvh] 
                          px-4 md:px-0 py-0 md:py-4 md:gap-2 
                          bg-white border-t md:border-t-0 md:border-r border-[#e2e8f0] flex-shrink-0 z-50">
          
          <div className="hidden md:flex mb-4 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-200" />
          </div>
          
          <div className="flex flex-row md:flex-col items-center justify-around md:justify-start gap-1 md:gap-1.5 flex-1 md:flex-none w-full md:px-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-9 h-9 rounded-lg bg-slate-100 md:w-full flex justify-center items-center">
                <div className="w-5 h-5 rounded-md bg-slate-200" />
              </div>
            ))}
          </div>
        </aside>
        
        <div className="flex flex-1 w-full min-h-0 overflow-hidden relative">
          {/* Chat List Skeleton */}
          <div className="hidden md:flex w-full md:w-[280px] lg:w-[320px] flex-shrink-0 h-full bg-[#f8fafc] border-r border-[#e2e8f0] flex-col pt-3 pb-2 px-2">
            <div className="px-2 mb-4">
              <div className="w-full h-[34px] bg-slate-200 rounded-md" />
            </div>
            <div className="px-2 mb-3">
              <div className="w-full h-7 bg-slate-200 rounded-md" />
            </div>
            <div className="flex-1 overflow-hidden space-y-0.5">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-[7px] mx-1.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 min-w-0 ml-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-24 h-3.5 bg-slate-200 rounded-sm" />
                      <div className="w-8 h-2.5 bg-slate-200 rounded-sm" />
                    </div>
                    <div className="w-3/4 h-3 bg-slate-200 rounded-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Chat Skeleton */}
          <main className="flex-1 min-w-0 w-full h-full bg-white flex flex-col">
            <div className="h-[72px] border-b border-[#e2e8f0] px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full" />
                <div className="flex flex-col gap-2">
                   <div className="w-32 h-4 bg-slate-200 rounded-sm" />
                   <div className="w-16 h-2.5 bg-slate-200 rounded-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-200 rounded-full" />
                <div className="w-8 h-8 bg-slate-200 rounded-full" />
              </div>
            </div>
            
            <div className="flex-1 p-0 flex flex-col justify-end pb-4">
              <div className="flex gap-3 px-6 py-2">
                <div className="w-8 h-8 bg-slate-200 rounded-full shrink-0" />
                <div className="flex flex-col gap-1 w-full max-w-[70%]">
                  <div className="w-20 h-3 bg-slate-200 rounded-sm mb-0.5 ml-1" />
                  <div className="w-48 h-[38px] bg-slate-100 rounded-2xl rounded-tl-sm" />
                  <div className="w-64 h-[58px] bg-slate-100 rounded-2xl rounded-tl-sm" />
                </div>
              </div>
              <div className="flex gap-3 px-6 py-2 flex-row-reverse">
                <div className="flex flex-col gap-1 w-full max-w-[70%] items-end">
                  <div className="w-64 h-[58px] bg-[#eef2ff] rounded-2xl rounded-tr-sm" />
                  <div className="w-32 h-[38px] bg-[#eef2ff] rounded-2xl rounded-tr-sm" />
                </div>
              </div>
            </div>
            
            <div className="p-4 shrink-0">
              <div className="w-full h-[52px] bg-slate-100 rounded-xl" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex flex-col-reverse md:flex-row h-[100dvh] w-full overflow-hidden bg-white">
      {/* Sidebar / Bottom Nav on mobile */}
      <div className={clsx(
        "flex-shrink-0 z-50",
        currentContact ? "hidden md:flex" : "flex"
      )}>
        <Sidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          currentUser={currentUser}
          unreadNotifications={notifications.length > 0 ? notifications.filter(n => !n.isRead).length : undefined}
        />
      </div>

      <div className="flex flex-1 w-full min-h-0 overflow-hidden relative">
        {/* Left panels (Chat List, Notifications, etc.) */}
        <div className={clsx(
          "w-full md:w-[280px] lg:w-[320px] flex-shrink-0 h-full bg-[#f8fafc] border-r border-[#e2e8f0] flex flex-col",
          currentContact ? "hidden md:flex" : "flex"
        )}>
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
        </div>

        {/* Main chat area */}
        <main className={clsx(
          "flex-col flex-1 min-w-0 w-full h-full bg-white relative",
          currentContact ? "flex" : "hidden md:flex"
        )}>
        {loading ? (
          <div className="flex-1 min-w-0 w-full h-full bg-white flex flex-col animate-pulse">
            <div className="h-[72px] border-b border-[#e2e8f0] px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full" />
                <div className="flex flex-col gap-2">
                   <div className="w-32 h-4 bg-slate-200 rounded-sm" />
                   <div className="w-16 h-2.5 bg-slate-200 rounded-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-200 rounded-full" />
                <div className="w-8 h-8 bg-slate-200 rounded-full" />
              </div>
            </div>
            
            <div className="flex-1 p-0 flex flex-col justify-end pb-4">
              <div className="flex gap-3 px-6 py-2">
                <div className="w-8 h-8 bg-slate-200 rounded-full shrink-0" />
                <div className="flex flex-col gap-1 w-full max-w-[70%]">
                  <div className="w-20 h-3 bg-slate-200 rounded-sm mb-0.5 ml-1" />
                  <div className="w-48 h-[38px] bg-slate-100 rounded-2xl rounded-tl-sm" />
                  <div className="w-64 h-[58px] bg-slate-100 rounded-2xl rounded-tl-sm" />
                </div>
              </div>
              <div className="flex gap-3 px-6 py-2 flex-row-reverse">
                <div className="flex flex-col gap-1 w-full max-w-[70%] items-end">
                  <div className="w-64 h-[58px] bg-[#eef2ff] rounded-2xl rounded-tr-sm" />
                  <div className="w-32 h-[38px] bg-[#eef2ff] rounded-2xl rounded-tr-sm" />
                </div>
              </div>
            </div>
            
            <div className="p-4 shrink-0">
              <div className="w-full h-[52px] bg-slate-100 rounded-xl" />
            </div>
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
                  key={`area-${currentContact.id}`}
                  messages={allMessages}
                  contact={currentContact}
                  currentUser={currentUser}
                  contacts={contacts}
                  typingUsers={activeRoomTypingUsers}
                  onViewFile={setViewingFile}
                  isSearchOpen={isSearchOpen}
                  setIsSearchOpen={setIsSearchOpen}
                />
                <MessageInput
                  key={`input-${currentContact.id}`}
                  onSendMessage={handleSend}
                  onTyping={sendTypingStatus}
                  contacts={contacts}
                  onViewFile={setViewingFile}
                />
              </>
            )}

            {activeTab === 'files' && <FilesPanel />}
            {activeTab === 'starred' && <StarredPanel />}
            {activeTab === 'search' && <SearchPanel />}
          </>
        ) : (
          <EmptyState contacts={contacts} />
        )}
      </main>
      </div>

      {/* Forward Message Sidebar */}
      {forwardingMessage && <ForwardSidebar />}

      {/* File Viewer Modal Overlay */}
      {viewingFile && <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />}
    </div>
  );
}
