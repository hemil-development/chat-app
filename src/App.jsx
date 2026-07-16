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

  // Listen to messages for active contact, and setup real-time subscriptions
  useEffect(() => {
    if (!activeContact) return;

    let isMounted = true;

    async function loadMessages() {
      if (!activeContact.roomId) {
        setAllMessages([]);
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', activeContact.roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching room messages:", error);
        return;
      }

      if (isMounted) {
        const formatted = (data || []).map(m => ({
          id: m.id,
          senderId: m.created_by === HEMIL_COMPANY_USER_ID ? 'me' : m.created_by,
          text: m.message,
          timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: m.type || 'text',
          createdAt: m.created_at,
        }));
        setAllMessages(formatted);
      }
    }

    loadMessages();

    // Subscribe to database inserts and typing broadcasts for the selected room
    let channel;
    if (activeContact.roomId) {
      channel = supabase.channel(`room-${activeContact.roomId}`);
      activeChannelRef.current = channel;

      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${activeContact.roomId}`,
          },
          (payload) => {
            const m = payload.new;
            if (isMounted) {
              setAllMessages(prev => {
                if (prev.some(x => x.id === m.id)) return prev;
                return [
                  ...prev,
                  {
                    id: m.id,
                    senderId: m.created_by === HEMIL_COMPANY_USER_ID ? 'me' : m.created_by,
                    text: m.message,
                    timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    type: m.type || 'text',
                    createdAt: m.created_at,
                  }
                ];
              });
            }
          }
        )
        .on(
          'broadcast',
          { event: 'typing' },
          ({ payload }) => {
            const { userId, isTyping } = payload;
            if (isMounted) {
              setTypingUsers(prev => {
                const roomTyping = prev[activeContact.roomId] || [];
                if (isTyping) {
                  if (roomTyping.includes(userId)) return prev;
                  return { ...prev, [activeContact.roomId]: [...roomTyping, userId] };
                } else {
                  return { ...prev, [activeContact.roomId]: roomTyping.filter(id => id !== userId) };
                }
              });

              if (isTyping) {
                if (typingTimeoutsRef.current[userId]) {
                  clearTimeout(typingTimeoutsRef.current[userId]);
                }
                typingTimeoutsRef.current[userId] = setTimeout(() => {
                  setTypingUsers(prev => {
                    const roomTyping = prev[activeContact.roomId] || [];
                    return { ...prev, [activeContact.roomId]: roomTyping.filter(id => id !== userId) };
                  });
                }, 5000);
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      activeChannelRef.current = null;
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeContact?.roomId, activeContact?.id]);

  // Subscribe to ALL message insertions globally to update sidebar previews in real-time
  useEffect(() => {
    const globalChannel = supabase
      .channel('global-messages-sidebar')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const m = payload.new;
          setContacts(prev => {
            const exists = prev.some(c => c.roomId === m.room_id);
            if (!exists) return prev;
            return prev.map(c => {
              if (c.roomId === m.room_id) {
                let text = m.message;
                if (c.isChannel) {
                  const sender = prev.find(x => x.id === m.created_by) || (m.created_by === HEMIL_COMPANY_USER_ID ? currentUser : null);
                  const senderName = sender ? (m.created_by === HEMIL_COMPANY_USER_ID ? 'You' : sender.name.split(' ')[0]) : 'Someone';
                  text = `${senderName}: ${m.message}`;
                } else if (m.created_by === HEMIL_COMPANY_USER_ID) {
                  text = `You: ${m.message}`;
                }
                return {
                  ...c,
                  lastMessage: text,
                  timestamp: formatMessageTime(m.created_at),
                };
              }
              return c;
            });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [currentUser]);

  // Subscribe to notification inserts for Hemil Gandhi in real-time
  useEffect(() => {
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${HEMIL_COMPANY_USER_ID}`,
        },
        async (payload) => {
          const newNotif = payload.new;
          try {
            // Fetch sender details to display avatar/name
            const { data: senderData } = await supabase
              .from('company_users')
              .select('*, users(*)')
              .eq('id', newNotif.sender_id)
              .single();

            const formatted = {
              id: newNotif.id,
              name: `${senderData?.users?.first_name || 'Someone'}`,
              action: newNotif.action,
              preview: newNotif.preview,
              time: formatMessageTime(newNotif.created_at),
              color: getUserColor(newNotif.sender_id),
              initial: `${senderData?.users?.first_name?.[0] || '?'}${senderData?.users?.last_name?.[0] || ''}`.toUpperCase(),
              emoji: newNotif.emoji || '🔔',
              isRead: newNotif.is_read,
              linkId: newNotif.link_id,
            };

            setNotifications(prev => [formatted, ...prev]);
          } catch (err) {
            console.error("Error formatting real-time notification:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSend = async (text) => {
    if (!activeContact) return;

    try {
      let roomId = activeContact.roomId;

      // 1. If room doesn't exist, create it
      if (!roomId) {
        const { data: existing } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('type', 'single')
          .contains('participants', [HEMIL_COMPANY_USER_ID, activeContact.id]);

        if (existing && existing.length > 0) {
          roomId = existing[0].id;
        } else {
          const roomName = `${currentUser.name} & ${activeContact.name}`;
          const { data: newRoom, error: roomErr } = await supabase
            .from('chat_rooms')
            .insert({
              type: 'single',
              participants: [HEMIL_COMPANY_USER_ID, activeContact.id],
              created_by: HEMIL_COMPANY_USER_ID,
              name: roomName,
              description: 'Direct message room',
              typing_participants: []
            })
            .select()
            .single();

          if (roomErr) {
            console.error("Failed to create room:", roomErr);
            return;
          }
          roomId = newRoom.id;
        }

        // Link room id to state immediately
        setContacts(prev => prev.map(c => {
          if (c.id === activeContact.id) {
            return { ...c, roomId };
          }
          return c;
        }));
        
        setActiveContact(prev => ({ ...prev, roomId }));
      }

      // 2. Insert message
      const { data: newMsg, error: msgErr } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          created_by: HEMIL_COMPANY_USER_ID,
          message: text,
          type: 'text'
        })
        .select()
        .single();

      if (msgErr) {
        console.error("Failed to send message:", msgErr);
        return;
      }

      // 3. Update room's last message pointer in DB
      await supabase
        .from('chat_rooms')
        .update({ last_message_id: newMsg.id })
        .eq('id', roomId);

      // 4. Update local state for smooth UX
      setAllMessages(prev => {
        if (prev.some(x => x.id === newMsg.id)) return prev;
        return [
          ...prev,
          {
            id: newMsg.id,
            senderId: 'me',
            text: newMsg.message,
            timestamp: new Date(newMsg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            type: 'text',
            createdAt: newMsg.created_at,
          }
        ];
      });

      setContacts(prev => prev.map(c => {
        if (c.id === activeContact.id || c.roomId === roomId) {
          return {
            ...c,
            roomId,
            lastMessage: `You: ${text}`,
            timestamp: formatMessageTime(newMsg.created_at),
          };
        }
        return c;
      }));

    } catch (err) {
      console.error("Error in handleSend:", err);
    }
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
                <MessageInput onSendMessage={handleSend} onTyping={sendTypingStatus} contacts={contacts} />
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
