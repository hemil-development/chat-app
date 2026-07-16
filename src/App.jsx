import { useState, useEffect, useRef } from 'react';
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

import { supabase } from './lib/supabase';
import { Login } from './components/Login';

// Predefined palette for premium avatar colors
const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#3b82f6', '#84cc16', '#f97316', '#a855f7', '#6366f1'];
function getUserColor(userId) {
  if (!userId) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}

function formatMessageTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const sortContacts = (list) => {
  return [...list].sort((a, b) => {
    const timeA = a.rawTimestamp ? new Date(a.rawTimestamp).getTime() : 0;
    const timeB = b.rawTimestamp ? new Date(b.rawTimestamp).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return a.name.localeCompare(b.name);
  });
};

export default function App() {
  const [session, setSession]       = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeNav,     setActiveNav]     = useState('chats');
  const [contacts,      setContacts]      = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [activeTab,     setActiveTab]     = useState('chat');
  const [allMessages,   setAllMessages]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [typingUsers,   setTypingUsers]   = useState({});
  const [notifications, setNotifications] = useState([]);

  const typingTimeoutsRef = useRef({});
  const [companyUserId, setCompanyUserId] = useState(null);
  const activeChannelRef  = useRef(null);
  const [currentUser,   setCurrentUser]   = useState(null);

  const currentContact = contacts.find(c => c.id === activeContact?.id) || activeContact;

  // Load initial data
  useEffect(() => {
    if (!companyUserId) return;
    async function loadData() {
      try {
        setLoading(true);
        // 1. Fetch current user details
        const { data: hemilData } = await supabase
          .from('company_users')
          .select('*, users(*)')
          .eq('id', companyUserId)
          .single();
        
        let resolvedCurrentUser = {
          id: companyUserId,
          name: 'Hemil Gandhi',
          initials: 'HG',
          color: '#4f46e5',
          status: 'online',
          role: 'Python Department',
        };

        if (hemilData && hemilData.users) {
          resolvedCurrentUser = {
            id: hemilData.id,
            name: `${hemilData.users.first_name || ''} ${hemilData.users.last_name || ''}`.trim(),
            initials: `${hemilData.users.first_name?.[0] || ''}${hemilData.users.last_name?.[0] || ''}`.toUpperCase() || 'HG',
            color: '#4f46e5',
            status: 'online',
            role: hemilData.department || hemilData.designation || 'Python Department',
            avatar: hemilData.users.avatar_url,
          };
          setCurrentUser(resolvedCurrentUser);
        }

        // 2. Fetch other company users
        const { data: cUsers } = await supabase
          .from('company_users')
          .select('*, users(*)')
          .neq('id', companyUserId);

        // 3. Fetch rooms
        const { data: rooms } = await supabase
          .from('chat_rooms')
          .select('*')
          .contains('participants', [companyUserId]);

        // 4. Fetch last messages
        const lastMessageIds = (rooms || []).map(r => r.last_message_id).filter(Boolean);
        let lastMessages = [];
        if (lastMessageIds.length > 0) {
          const { data: msgs } = await supabase
            .from('chat_messages')
            .select('*')
            .in('id', lastMessageIds);
          lastMessages = msgs || [];
        }

        // 4.5 Fetch unread messages to calculate badge counts
        const { data: unreadMessages } = await supabase
          .from('chat_messages')
          .select('id, room_id, read_by_users')
          .neq('created_by', companyUserId);

        const getUnreadCountForRoom = (roomId) => {
          if (!roomId) return 0;
          return (unreadMessages || []).filter(m => {
            if (m.room_id !== roomId) return false;
            const readList = m.read_by_users || [];
            const hasRead = readList.some(item => {
              const parsed = typeof item === 'string' ? JSON.parse(item) : item;
              return parsed?.user_id === companyUserId;
            });
            return !hasRead;
          }).length;
        };

        // Helper to format last message string
        const formatLastMsg = (msg) => {
          if (!msg) return '';
          if (msg.created_by === companyUserId) {
            return `You: ${msg.message || ''}`;
          }
          const sender = (cUsers || []).find(cu => cu.id === msg.created_by);
          const senderName = sender?.users?.first_name || 'Someone';
          return `${senderName}: ${msg.message || ''}`;
        };

        // 5. Build group chats list
        const groupContacts = (rooms || [])
          .filter(r => r.type === 'group')
          .map(r => {
            const lastMsg = lastMessages.find(m => m.id === r.last_message_id);
            return {
              id: r.id,
              roomId: r.id,
              name: r.name || 'Group Chat',
              initials: (r.name || 'GC').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2),
              color: getUserColor(r.id),
              status: null,
              role: 'Channel',
              lastMessage: lastMsg ? formatLastMsg(lastMsg) : 'No messages yet',
              timestamp: lastMsg ? formatMessageTime(lastMsg.created_at) : '',
              rawTimestamp: lastMsg ? lastMsg.created_at : '',
              unread: getUnreadCountForRoom(r.id),
              pinned: false,
              isChannel: true,
            };
          });

        // 6. Build direct chats list (one for each colleague)
        const directContacts = (cUsers || []).map(cu => {
          const matchingRoom = (rooms || []).find(r => 
            r.type === 'single' && 
            r.participants.includes(companyUserId) && 
            r.participants.includes(cu.id)
          );
          
          const lastMsg = matchingRoom ? lastMessages.find(m => m.id === matchingRoom.last_message_id) : null;
          
          return {
            id: cu.id,
            roomId: matchingRoom ? matchingRoom.id : null,
            name: `${cu.users?.first_name || ''} ${cu.users?.last_name || ''}`.trim() || 'Colleague',
            initials: `${cu.users?.first_name?.[0] || ''}${cu.users?.last_name?.[0] || ''}`.toUpperCase() || '?',
            color: getUserColor(cu.id),
            status: cu.is_active ? 'online' : 'offline',
            role: cu.department || cu.designation || 'Colleague',
            lastSeen: cu.is_active ? 'Online' : 'Offline',
            lastMessage: lastMsg ? (lastMsg.created_by === companyUserId ? `You: ${lastMsg.message}` : lastMsg.message) : 'Click to start chatting',
            timestamp: lastMsg ? formatMessageTime(lastMsg.created_at) : '',
            rawTimestamp: lastMsg ? lastMsg.created_at : '',
            unread: getUnreadCountForRoom(matchingRoom ? matchingRoom.id : null),
            pinned: false,
            isChannel: false,
          };
        });

        const merged = [...groupContacts, ...directContacts];
        setContacts(sortContacts(merged));

        if (merged.length > 0) {
          setActiveContact(merged[0]);
        }

        // 7. Fetch notifications
        try {
          const { data: dbNotifs } = await supabase
            .from('notifications')
            .select(`
              *,
              sender:company_users(
                id,
                users(
                  id,
                  first_name,
                  last_name,
                  avatar_url
                )
              )
            `)
            .eq('recipient_id', companyUserId)
            .order('created_at', { ascending: false });

          if (dbNotifs) {
            const formattedNotifs = dbNotifs.map(n => ({
              id: n.id,
              name: `${n.sender?.users?.first_name || 'Someone'}`,
              action: n.action,
              preview: n.preview,
              time: formatMessageTime(n.created_at),
              color: getUserColor(n.sender_id),
              initial: `${n.sender?.users?.first_name?.[0] || '?'}${n.sender?.users?.last_name?.[0] || ''}`.toUpperCase(),
              emoji: n.emoji || '🔔',
              isRead: n.is_read,
              linkId: n.link_id,
            }));
            setNotifications(formattedNotifs);
          }
        } catch (errNotif) {
          console.warn("Could not load notifications from DB, falling back to mocks:", errNotif);
        }

      } catch (error) {
        console.error("Failed to load initial chat data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [companyUserId]);

  // Listen to messages for active contact, and setup real-time subscriptions
  useEffect(() => {
    if (!currentContact) return;

    let isMounted = true;

    async function loadMessages() {
      if (!currentContact.roomId) {
        setAllMessages([]);
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', currentContact.roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching room messages:", error);
        return;
      }

      if (isMounted) {
        const formatted = (data || []).map(m => ({
          id: m.id,
          senderId: m.created_by === companyUserId ? 'me' : m.created_by,
          text: m.message,
          timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: m.type || 'text',
          createdAt: m.created_at,
          readByUsers: m.read_by_users,
        }));
        setAllMessages(formatted);
      }

      // Mark messages in this room as read in the database
      markMessagesAsRead(currentContact.roomId);
    }

    loadMessages();

    // Subscribe to database inserts, updates and typing broadcasts for the selected room
    let channel;
    if (currentContact.roomId) {
      channel = supabase.channel(`room-${currentContact.roomId}`);
      activeChannelRef.current = channel;

      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${currentContact.roomId}`,
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
                    senderId: m.created_by === companyUserId ? 'me' : m.created_by,
                    text: m.message,
                    timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    type: m.type || 'text',
                    createdAt: m.created_at,
                    readByUsers: m.read_by_users,
                  }
                ];
              });

              // If someone else sent it, mark it as read immediately since we are in this room
              if (m.created_by !== companyUserId) {
                markMessagesAsRead(currentContact.roomId);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${currentContact.roomId}`,
          },
          (payload) => {
            const m = payload.new;
            if (isMounted) {
              setAllMessages(prev => prev.map(msg => {
                if (msg.id === m.id) {
                  return {
                    ...msg,
                    readByUsers: m.read_by_users,
                  };
                }
                return msg;
              }));
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
                const roomTyping = prev[currentContact.roomId] || [];
                if (isTyping) {
                  if (roomTyping.includes(userId)) return prev;
                  return { ...prev, [currentContact.roomId]: [...roomTyping, userId] };
                } else {
                  return { ...prev, [currentContact.roomId]: roomTyping.filter(id => id !== userId) };
                }
              });

              if (isTyping) {
                if (typingTimeoutsRef.current[userId]) {
                  clearTimeout(typingTimeoutsRef.current[userId]);
                }
                typingTimeoutsRef.current[userId] = setTimeout(() => {
                  setTypingUsers(prev => {
                    const roomTyping = prev[currentContact.roomId] || [];
                    return { ...prev, [currentContact.roomId]: roomTyping.filter(id => id !== userId) };
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
  }, [currentContact, companyUserId]);

  // Subscribe to ALL message insertions globally to update sidebar previews and badges in real-time
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
            const exists = prev.some(c => c.roomId === m.room_id || (!c.roomId && c.id === m.created_by));
            if (!exists) return prev;
            const updated = prev.map(c => {
              if (c.roomId === m.room_id || (!c.roomId && c.id === m.created_by)) {
                let text = m.message;
                if (c.isChannel) {
                  const sender = prev.find(x => x.id === m.created_by) || (m.created_by === companyUserId ? currentUser : null);
                  const senderName = sender ? (m.created_by === companyUserId ? 'You' : sender.name.split(' ')[0]) : 'Someone';
                  text = `${senderName}: ${m.message}`;
                } else if (m.created_by === companyUserId) {
                  text = `You: ${m.message}`;
                }
                
                const isIncomingFromOtherRoom = m.created_by !== companyUserId && 
                                                currentContact?.roomId !== m.room_id && 
                                                currentContact?.id !== c.id;

                return {
                  ...c,
                  roomId: m.room_id,
                  lastMessage: text,
                  timestamp: formatMessageTime(m.created_at),
                  rawTimestamp: m.created_at,
                  unread: isIncomingFromOtherRoom ? c.unread + 1 : c.unread,
                };
              }
              return c;
            });
            return sortContacts(updated);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [currentUser, currentContact, companyUserId]);

  // Subscribe to new rooms in real-time (to instantly update direct lists and GC channels)
  useEffect(() => {
    if (!companyUserId) return;
    const roomsChannel = supabase
      .channel('realtime-rooms')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_rooms',
        },
        async (payload) => {
          const newRoom = payload.new;
          if (newRoom.participants.includes(companyUserId)) {
            if (newRoom.type === 'group') {
              const newGC = {
                id: newRoom.id,
                roomId: newRoom.id,
                name: newRoom.name || 'Group Chat',
                initials: (newRoom.name || 'GC').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2),
                color: getUserColor(newRoom.id),
                status: null,
                role: 'Channel',
                lastMessage: 'No messages yet',
                timestamp: '',
                rawTimestamp: newRoom.created_at,
                unread: 0,
                pinned: false,
                isChannel: true,
              };
              setContacts(prev => sortContacts([newGC, ...prev]));
            } else {
              const otherId = newRoom.participants.find(p => p !== companyUserId);
              if (otherId) {
                setContacts(prev => prev.map(c => {
                  if (c.id === otherId) {
                    return {
                      ...c,
                      roomId: newRoom.id,
                    };
                  }
                  return c;
                }));
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
    };
  }, [companyUserId]);

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
          filter: `recipient_id=eq.${companyUserId}`,
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

  const markMessagesAsRead = async (roomId) => {
    if (!roomId || !companyUserId) return;
    try {
      // 1. Fetch unread messages in this room sent by other users
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('id, read_by_users')
        .eq('room_id', roomId)
        .neq('created_by', companyUserId);

      if (!msgs || msgs.length === 0) return;

      // 2. Filter messages that haven't been read by this user yet
      for (const m of msgs) {
        const readList = m.read_by_users || [];
        const alreadyRead = readList.some(item => {
          const parsed = typeof item === 'string' ? JSON.parse(item) : item;
          return parsed?.user_id === companyUserId;
        });

        if (!alreadyRead) {
          const updatedList = [...readList, { user_id: companyUserId, read_at: new Date().toISOString() }];
          await supabase
            .from('chat_messages')
            .update({ read_by_users: updatedList })
            .eq('id', m.id);
        }
      }
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const handleSend = async (text) => {
    if (!currentContact) return;

    try {
      let roomId = currentContact.roomId;

      // 1. If room doesn't exist, create it
      if (!roomId) {
        const { data: existing } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('type', 'single')
          .contains('participants', [companyUserId, currentContact.id]);

        if (existing && existing.length > 0) {
          roomId = existing[0].id;
        } else {
          const roomName = `${currentUser.name} & ${currentContact.name}`;
          const { data: newRoom, error: roomErr } = await supabase
            .from('chat_rooms')
            .insert({
              type: 'single',
              participants: [companyUserId, currentContact.id],
              created_by: companyUserId,
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
          if (c.id === currentContact.id) {
            return { ...c, roomId };
          }
          return c;
        }));
        
        setActiveContact(prev => prev ? { ...prev, roomId } : null);
      }

      // 2. Insert message
      const { data: newMsg, error: msgErr } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          created_by: companyUserId,
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

      setContacts(prev => {
        const updated = prev.map(c => {
          if (c.id === currentContact.id || c.roomId === roomId) {
            return {
              ...c,
              roomId,
              lastMessage: `You: ${text}`,
              timestamp: formatMessageTime(newMsg.created_at),
              rawTimestamp: newMsg.created_at,
            };
          }
          return c;
        });
        return sortContacts(updated);
      });

    } catch (err) {
      console.error("Error in handleSend:", err);
    }
  };

  const handleSelect = (contact) => {
    setActiveContact(contact);
    setActiveTab('chat');

    // Reset local unread counts
    setContacts(prev => prev.map(c => {
      if (c.id === contact.id || (contact.roomId && c.roomId === contact.roomId)) {
        return { ...c, unread: 0 };
      }
      return c;
    }));

    if (contact.roomId) {
      markMessagesAsRead(contact.roomId);
    }
  };

  const sendTypingStatus = (isTyping) => {
    if (activeChannelRef.current) {
      activeChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: companyUserId, isTyping },
      });
    }
  };

  const activeRoomTypingUserIds = typingUsers[currentContact?.roomId] || [];
  const activeRoomTypingUsers = activeRoomTypingUserIds
    .map(id => contacts.find(c => c.id === id))
    .filter(Boolean);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        const { data: cu } = await supabase.from('company_users').select('id').eq('user_id', session.user.id).single();
        if (cu) setCompanyUserId(cu.id);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        const { data: cu } = await supabase.from('company_users').select('id').eq('user_id', session.user.id).single();
        if (cu) setCompanyUserId(cu.id);
      } else {
        setCompanyUserId(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
              setActiveContact(target);
              setActiveNav('chats');
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
