import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getUserColor, formatMessageTime, formatBytes, sortContacts } from '../utils/helpers';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { companyUserId } = useAuth();
  
  const [activeNav,     setActiveNav]     = useState('chats');
  const [contacts,      setContacts]      = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [activeTab,     setActiveTab]     = useState('chat');
  const [allMessages,   setAllMessages]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [typingUsers,   setTypingUsers]   = useState({});
  const [notifications, setNotifications] = useState([]);
  const [viewingFile,   setViewingFile]   = useState(null);
  const [currentUser,   setCurrentUser]   = useState(null);

  const typingTimeoutsRef = useRef({});
  const activeChannelRef  = useRef(null);

  const currentContact = contacts.find(c => c.id === activeContact?.id) || activeContact;
  const activeRoomTypingUserIds = typingUsers[currentContact?.roomId] || [];
  const activeRoomTypingUsers = activeRoomTypingUserIds
    .map(id => contacts.find(c => c.id === id))
    .filter(Boolean);

  // Request native notification permissions on startup
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

        // 6. Build direct chats list
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
            const filtered = dbNotifs.filter(n => {
              const act = (n.action || '').toLowerCase();
              return act.includes('mention') || act.includes('react');
            });
            const formattedNotifs = filtered.map(n => ({
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

  const markMessagesAsRead = useCallback(async (roomId) => {
    if (!roomId || !companyUserId) return;
    try {
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('id, read_by_users')
        .eq('room_id', roomId)
        .neq('created_by', companyUserId);

      if (!msgs || msgs.length === 0) return;

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
  }, [companyUserId]);

  const sendTypingStatus = (isTyping) => {
    if (activeChannelRef.current) {
      activeChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: companyUserId, isTyping },
      });
    }
  };

  const handleSelect = useCallback((contact) => {
    setActiveContact(contact);
    setActiveTab('chat');
    setActiveNav('chats');
    setContacts(prev => prev.map(c => {
      if (c.id === contact.id || (contact.roomId && c.roomId === contact.roomId)) {
        return { ...c, unread: 0 };
      }
      return c;
    }));
    if (contact.roomId) markMessagesAsRead(contact.roomId);
  }, [markMessagesAsRead, setActiveNav]);

  const handleSend = async (text) => {
    if (!currentContact) return;

    try {
      let roomId = currentContact.roomId;
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

          if (roomErr) return console.error("Failed to create room:", roomErr);
          roomId = newRoom.id;
        }
        setContacts(prev => prev.map(c => c.id === currentContact.id ? { ...c, roomId } : c));
        setActiveContact(prev => prev ? { ...prev, roomId } : null);
      }

      const { data: newMsg, error: msgErr } = await supabase
        .from('chat_messages')
        .insert({ room_id: roomId, created_by: companyUserId, message: text, type: 'text' })
        .select()
        .single();

      if (msgErr) return console.error("Failed to send message:", msgErr);

      await supabase.from('chat_rooms').update({ last_message_id: newMsg.id }).eq('id', roomId);

      setAllMessages(prev => {
        if (prev.some(x => x.id === newMsg.id)) return prev;
        return [...prev, {
          id: newMsg.id,
          senderId: 'me',
          text: newMsg.message,
          timestamp: new Date(newMsg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
          createdAt: newMsg.created_at,
        }];
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

  const handleFileUpload = async (file) => {
    if (!currentContact) return;
    try {
      let roomId = currentContact.roomId;
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

          if (roomErr) throw roomErr;
          roomId = newRoom.id;
          setContacts(prev => prev.map(c => c.id === currentContact.id ? { ...c, roomId } : c));
          setActiveContact(prev => ({ ...prev, roomId }));
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${companyUserId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat_documents/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('chat').upload(filePath, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('chat').getPublicUrl(filePath, { download: file.name });

      const fileMeta = { name: file.name, size: formatBytes(file.size), url: publicUrl, type: file.type };
      
      const { data: newMsg, error: msgErr } = await supabase
        .from('chat_messages')
        .insert({ room_id: roomId, created_by: companyUserId, message: JSON.stringify(fileMeta), type: 'file' })
        .select()
        .single();

      if (msgErr) throw msgErr;

      await supabase.from('chat_rooms').update({ last_message_id: newMsg.id }).eq('id', roomId);

      setAllMessages(prev => {
        if (prev.some(x => x.id === newMsg.id)) return prev;
        return [...prev, {
          id: newMsg.id,
          senderId: 'me',
          text: '',
          file: fileMeta,
          timestamp: new Date(newMsg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: 'file',
          createdAt: newMsg.created_at,
        }];
      });

      setContacts(prev => prev.map(c => {
        if (c.id === currentContact.id || c.roomId === roomId) {
          return {
            ...c,
            roomId,
            lastMessage: `You: sent a file`,
            timestamp: formatMessageTime(newMsg.created_at),
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Error in handleFileUpload:", err);
      alert("Failed to upload file. Please try again.");
    }
  };

  // Listen to messages for active contact
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
        const formatted = (data || []).map(m => {
          let fileMeta = null;
          let text = m.message;
          if (m.type === 'file') {
            try { fileMeta = JSON.parse(m.message); text = ''; } catch(e) {}
          }
          return {
            id: m.id,
            senderId: m.created_by === companyUserId ? 'me' : m.created_by,
            text,
            file: fileMeta,
            timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            type: m.type || 'text',
            createdAt: m.created_at,
            readByUsers: m.read_by_users,
          };
        });
        setAllMessages(formatted);
      }

      markMessagesAsRead(currentContact.roomId);
    }

    loadMessages();

    let channel;
    if (currentContact.roomId) {
      channel = supabase.channel(`room-${currentContact.roomId}`);
      activeChannelRef.current = channel;

      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${currentContact.roomId}` },
          (payload) => {
            const m = payload.new;
            if (isMounted) {
              setAllMessages(prev => {
                if (prev.some(x => x.id === m.id)) return prev;
                let fileMeta = null;
                let text = m.message;
                if (m.type === 'file') {
                  try { fileMeta = JSON.parse(m.message); text = ''; } catch(e) {}
                }
                return [
                  ...prev,
                  {
                    id: m.id,
                    senderId: m.created_by === companyUserId ? 'me' : m.created_by,
                    text,
                    file: fileMeta,
                    timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    type: m.type || 'text',
                    createdAt: m.created_at,
                    readByUsers: m.read_by_users,
                  }
                ];
              });

              if (m.created_by !== companyUserId) {
                markMessagesAsRead(currentContact.roomId);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${currentContact.roomId}` },
          (payload) => {
            const m = payload.new;
            if (isMounted) {
              setAllMessages(prev => prev.map(msg => {
                if (msg.id === m.id) return { ...msg, readByUsers: m.read_by_users };
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
  }, [currentContact, companyUserId, markMessagesAsRead]);

  // Global messages sidebar
  useEffect(() => {
    const globalChannel = supabase
      .channel('global-messages-sidebar')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const m = payload.new;
          setContacts(prev => {
            const exists = prev.some(c => c.roomId === m.room_id || (!c.roomId && c.id === m.created_by));
            if (!exists) {
              if (m.room_id) {
                supabase
                  .from('chat_rooms')
                  .select('*')
                  .eq('id', m.room_id)
                  .single()
                  .then(async ({ data: room }) => {
                    if (!room) return;
                    let newContact = null;
                    
                    if (room.type === 'group') {
                      newContact = {
                        id: room.id,
                        roomId: room.id,
                        name: room.name || 'Group Chat',
                        initials: (room.name || 'GC').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2),
                        color: getUserColor(room.id),
                        status: null,
                        role: 'Channel',
                        lastMessage: m.type === 'file' ? 'sent a file' : m.message,
                        timestamp: formatMessageTime(m.created_at),
                        rawTimestamp: m.created_at,
                        unread: m.created_by !== companyUserId ? 1 : 0,
                        pinned: false,
                        isChannel: true,
                      };
                    } else {
                      const otherId = room.participants.find(p => p !== companyUserId);
                      if (otherId) {
                        const { data: cu } = await supabase
                          .from('company_users')
                          .select('*, users(*)')
                          .eq('id', otherId)
                          .single();
                        
                        if (cu) {
                          newContact = {
                            id: cu.id,
                            roomId: room.id,
                            name: `${cu.users?.first_name || ''} ${cu.users?.last_name || ''}`.trim() || 'Colleague',
                            initials: `${cu.users?.first_name?.[0] || ''}${cu.users?.last_name?.[0] || ''}`.toUpperCase() || '?',
                            color: getUserColor(cu.id),
                            status: cu.is_active ? 'online' : 'offline',
                            role: cu.department || cu.designation || 'Colleague',
                            lastSeen: cu.is_active ? 'Online' : 'Offline',
                            lastMessage: m.type === 'file' ? 'sent a file' : m.message,
                            timestamp: formatMessageTime(m.created_at),
                            rawTimestamp: m.created_at,
                            unread: m.created_by !== companyUserId ? 1 : 0,
                            pinned: false,
                            isChannel: false,
                          };
                        }
                      }
                    }

                    if (newContact) {
                      setContacts(latest => {
                        if (latest.some(x => x.roomId === room.id)) return latest;
                        return sortContacts([newContact, ...latest]);
                      });
                    }
                  });
              }
              return prev;
            }

            const updated = prev.map(c => {
              if (c.roomId === m.room_id || (!c.roomId && c.id === m.created_by)) {
                let text = m.type === 'file' ? 'sent a file' : m.message;
                if (c.isChannel) {
                  const sender = prev.find(x => x.id === m.created_by) || (m.created_by === companyUserId ? currentUser : null);
                  const senderName = sender ? (m.created_by === companyUserId ? 'You' : sender.name.split(' ')[0]) : 'Someone';
                  text = `${senderName}: ${text}`;
                } else if (m.created_by === companyUserId) {
                  text = `You: ${text}`;
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

          // Trigger native Chrome push notification for incoming messages
          if (m.created_by !== companyUserId) {
            if ('Notification' in window && Notification.permission === 'granted') {
              if (document.visibilityState === 'hidden' || currentContact?.roomId !== m.room_id) {
                supabase
                  .from('company_users')
                  .select('*, users(*)')
                  .eq('id', m.created_by)
                  .single()
                  .then(({ data: senderData }) => {
                    const senderName = senderData 
                      ? `${senderData.users?.first_name || ''} ${senderData.users?.last_name || ''}`.trim()
                      : 'Someone';
                      
                    const bodyText = m.type === 'file' ? '📁 Sent a file' : m.message;
                    const desktopNotif = new Notification(senderName, {
                      body: bodyText,
                      icon: '/favicon.ico'
                    });

                    desktopNotif.onclick = () => {
                      window.focus();
                      setContacts(latestContacts => {
                        const target = latestContacts.find(c => c.roomId === m.room_id || c.id === m.created_by);
                        if (target) {
                          setTimeout(() => handleSelect(target), 0);
                        }
                        return latestContacts;
                      });
                    };
                  });
              }
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(globalChannel);
  }, [currentUser, currentContact, companyUserId, handleSelect]);

  // Realtime rooms
  useEffect(() => {
    if (!companyUserId) return;
    const roomsChannel = supabase
      .channel('realtime-rooms')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_rooms' },
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
                  if (c.id === otherId) return { ...c, roomId: newRoom.id };
                  return c;
                }));
              }
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(roomsChannel);
  }, [companyUserId]);

  // Realtime notifications
  useEffect(() => {
    if (!companyUserId) return;
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${companyUserId}` },
        async (payload) => {
          const newNotif = payload.new;
          const act = (newNotif.action || '').toLowerCase();
          if (!act.includes('mention') && !act.includes('react')) return;

          try {
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

            // Trigger Chrome notification for mentions/reactions
            if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState === 'hidden') {
              const bodyText = `${formatted.emoji} ${formatted.action}: "${formatted.preview}"`;
              const desktopNotif = new Notification(formatted.name, {
                body: bodyText,
                icon: '/favicon.ico'
              });
              desktopNotif.onclick = () => {
                window.focus();
                setTimeout(() => {
                  setActiveNav('notifications');
                }, 0);
              };
            }
          } catch (err) {
            console.error("Error formatting real-time notification:", err);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [companyUserId, setActiveNav]);

  const value = {
    activeNav, setActiveNav,
    contacts, setContacts,
    activeContact, setActiveContact,
    activeTab, setActiveTab,
    allMessages,
    loading,
    notifications, setNotifications,
    viewingFile, setViewingFile,
    currentUser, currentContact,
    activeRoomTypingUsers,
    handleSend, handleFileUpload, handleSelect, sendTypingStatus
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
