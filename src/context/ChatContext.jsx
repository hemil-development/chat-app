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
  const [chatAlert,     setChatAlert]     = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [quoteMessage, setQuoteMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);

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

  // Auto-dismiss chat alert after 5 seconds
  useEffect(() => {
    if (chatAlert) {
      const timer = setTimeout(() => setChatAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [chatAlert]);

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
        const formatLastMsg = (msg, isGroup = false) => {
          if (!msg) return '';
          const isYou = msg.created_by === companyUserId;
          
          let prefix = '';
          if (isGroup) {
            if (isYou) {
              prefix = 'You: ';
            } else {
              const sender = (cUsers || []).find(cu => cu.id === msg.created_by);
              const senderName = sender?.users?.first_name || 'Someone';
              prefix = `${senderName}: `;
            }
          } else {
            if (isYou) {
              prefix = 'You: ';
            }
          }

          let isForwarded = msg.is_forwarded || false;
          let msgText = msg.message || '';
          if (msg.type === 'text') {
            if (!isForwarded && msg.message) {
              try {
                const parsed = JSON.parse(msg.message);
                if (parsed && typeof parsed === 'object' && 'isForwarded' in parsed) {
                  msgText = parsed.text || '';
                  isForwarded = true;
                }
              } catch (e) {
                if (msg.message.startsWith('[Forwarded]\n')) {
                  msgText = msg.message.substring(12);
                  isForwarded = true;
                }
              }
            }
          }

          if (msg.type === 'file') {
            try {
              const fileMeta = typeof msg.message === 'string' ? JSON.parse(msg.message) : msg.message;
              const isImg = fileMeta?.type?.startsWith('image/');
              return `${prefix}sent a ${isImg ? 'image' : 'file'}`;
            } catch (e) {
              return `${prefix}sent a file`;
            }
          }
          
          // Strip markdown characters before returning
          const cleanText = msgText
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/_([^_]+)_/g, '$1');
          
          return `${prefix}${cleanText}`;
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
              lastMessage: lastMsg ? formatLastMsg(lastMsg, true) : 'No messages yet',
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
            lastMessage: lastMsg ? formatLastMsg(lastMsg, false) : 'Click to start chatting',
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

  const getOrCreateRoomForContact = async (contact) => {
    if (contact.roomId) return contact.roomId;

    const { data: existing } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('type', 'single')
      .contains('participants', [companyUserId, contact.id]);

    if (existing && existing.length > 0) {
      const roomId = existing[0].id;
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, roomId } : c));
      return roomId;
    }

    const roomName = `${currentUser?.name || 'User'} & ${contact.name}`;
    const { data: newRoom, error: roomErr } = await supabase
      .from('chat_rooms')
      .insert({
        type: 'single',
        participants: [companyUserId, contact.id],
        created_by: companyUserId,
        name: roomName,
        description: 'Direct message room',
        typing_participants: []
      })
      .select()
      .single();

    if (roomErr) {
      console.error("Failed to create room:", roomErr);
      throw roomErr;
    }

    const roomId = newRoom.id;
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, roomId } : c));
    return roomId;
  };

  const handleSend = async (text, files) => {
    if (!currentContact) return;

    try {
      let roomId = currentContact.roomId;
      if (!roomId) {
        roomId = await getOrCreateRoomForContact(currentContact);
        setActiveContact(prev => prev ? { ...prev, roomId } : null);
      }

      let lastUploadedMsg = null;

      if (files && files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${companyUserId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `chat_documents/${fileName}`;
          
          const { error: uploadError } = await supabase.storage.from('chat').upload(filePath, file);
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage.from('chat').getPublicUrl(filePath, { download: file.name });
          const fileMeta = { name: file.name, size: formatBytes(file.size), url: publicUrl, type: file.type };

          const { data: insertedMsg, error: msgErr } = await supabase
            .from('chat_messages')
            .insert({ room_id: roomId, created_by: companyUserId, message: JSON.stringify(fileMeta), type: 'file' })
            .select()
            .single();

          if (msgErr) throw msgErr;
          lastUploadedMsg = insertedMsg;

          setAllMessages(prev => {
            if (prev.some(x => x.id === insertedMsg.id)) return prev;
            return [...prev, {
              id: insertedMsg.id,
              senderId: 'me',
              text: '',
              file: fileMeta,
              timestamp: new Date(insertedMsg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              type: 'file',
              createdAt: insertedMsg.created_at,
            }];
          });
        }
      }

      let newMsgText = null;
      if (text) {
        const { data: insertedMsg, error: msgErr } = await supabase
          .from('chat_messages')
          .insert({ room_id: roomId, created_by: companyUserId, message: text, type: 'text' })
          .select()
          .single();

        if (msgErr) return console.error("Failed to send message:", msgErr);
        newMsgText = insertedMsg;

        setAllMessages(prev => {
          if (prev.some(x => x.id === insertedMsg.id)) return prev;
          return [...prev, {
            id: insertedMsg.id,
            senderId: 'me',
            text: insertedMsg.message,
            timestamp: new Date(insertedMsg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            type: 'text',
            createdAt: insertedMsg.created_at,
          }];
        });
      }

      const latestMsg = newMsgText || lastUploadedMsg;
      if (latestMsg) {
        await supabase.from('chat_rooms').update({ last_message_id: latestMsg.id }).eq('id', roomId);

        setContacts(prev => {
          const updated = prev.map(c => {
            if (c.id === currentContact.id || c.roomId === roomId) {
              let preview = '';
              if (newMsgText) {
                const cleanText = text
                  .replace(/\*([^*]+)\*/g, '$1')
                  .replace(/_([^_]+)_/g, '$1');
                preview = `You: ${cleanText}`;
              } else if (lastUploadedMsg) {
                const isImg = fileMeta?.type?.startsWith('image/');
                preview = `You: sent a ${isImg ? 'image' : 'file'}`;
              }
              return {
                ...c,
                roomId,
                lastMessage: preview,
                timestamp: formatMessageTime(latestMsg.created_at),
                rawTimestamp: latestMsg.created_at,
              };
            }
            return c;
          });
          return sortContacts(updated);
        });
      }
    } catch (err) {
      console.error("Error in handleSend:", err);
    }
  };

  const handleForwardMessage = async (message, targetContacts) => {
    try {
      let forwardedMessageValue = '';
      let forwardedType = message.type;
      if (message.type === 'file') {
        forwardedMessageValue = JSON.stringify(message.file);
      } else {
        forwardedMessageValue = message.text;
      }
 
      for (const contact of targetContacts) {
        const roomId = await getOrCreateRoomForContact(contact);
        
        const { data: insertedMsg, error: msgErr } = await supabase
          .from('chat_messages')
          .insert({
            room_id: roomId,
            created_by: companyUserId,
            message: forwardedMessageValue,
            type: forwardedType,
            is_forwarded: true
          })
          .select()
          .single();

        if (msgErr) {
          console.error("Failed to insert forwarded message:", msgErr);
          continue;
        }

        await supabase.from('chat_rooms').update({ last_message_id: insertedMsg.id }).eq('id', roomId);

        if (currentContact && (currentContact.id === contact.id || currentContact.roomId === roomId)) {
          setAllMessages(prev => {
            if (prev.some(x => x.id === insertedMsg.id)) return prev;
            
            let fileMeta = null;
            let text = message.text;
            if (insertedMsg.type === 'file') {
              fileMeta = message.file;
              text = '';
            }

            return [...prev, {
              id: insertedMsg.id,
              senderId: 'me',
              text: text,
              file: fileMeta,
              isForwarded: true,
              timestamp: new Date(insertedMsg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              type: insertedMsg.type || 'text',
              createdAt: insertedMsg.created_at,
              readByUsers: insertedMsg.read_by_users,
              reactions: [],
            }];
          });
        }

        setContacts(prev => {
          const updated = prev.map(c => {
            if (c.id === contact.id || c.roomId === roomId) {
              let preview = '';
              if (insertedMsg.type === 'file') {
                const isImg = message.file?.type?.startsWith('image/');
                preview = `You: sent a ${isImg ? 'image' : 'file'}`;
              } else {
                const cleanText = message.text
                  .replace(/\*([^*]+)\*/g, '$1')
                  .replace(/_([^_]+)_/g, '$1');
                preview = `You: ${cleanText}`;
              }
              return {
                ...c,
                roomId,
                lastMessage: preview,
                timestamp: formatMessageTime(insertedMsg.created_at),
                rawTimestamp: insertedMsg.created_at,
              };
            }
            return c;
          });
          return sortContacts(updated);
        });
      }

      setChatAlert({ type: 'success', message: 'Message forwarded successfully' });
    } catch (err) {
      console.error("Error in handleForwardMessage:", err);
      setChatAlert({ type: 'error', message: 'Failed to forward message' });
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
          let isForwarded = m.is_forwarded || false;
          if (!isForwarded) {
            if (m.type === 'file') {
              try { fileMeta = JSON.parse(m.message); text = ''; isForwarded = !!fileMeta?.isForwarded; } catch(e) {}
            } else {
              try {
                const parsed = JSON.parse(m.message);
                if (parsed && typeof parsed === 'object' && 'isForwarded' in parsed) {
                  text = parsed.text || '';
                  isForwarded = true;
                }
              } catch (e) {
                if (m.message && m.message.startsWith('[Forwarded]\n')) {
                  text = m.message.substring(12);
                  isForwarded = true;
                }
              }
            }
          } else {
            if (m.type === 'file') {
              try { fileMeta = JSON.parse(m.message); text = ''; } catch(e) {}
            }
          }
          return {
            id: m.id,
            senderId: m.created_by === companyUserId ? 'me' : m.created_by,
            text,
            file: fileMeta,
            isForwarded,
            timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            type: m.type || 'text',
            createdAt: m.created_at,
            readByUsers: m.read_by_users,
            reactions: m.reaction_by_users || [],
            isEdited: m.is_edited,
            isDeleted: m.is_deleted,
            isStarred: (m.star_by_users || []).some(s => {
              const parsed = typeof s === 'string' ? JSON.parse(s) : s;
              return parsed?.user_id === companyUserId;
            }),
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
                let isForwarded = m.is_forwarded || false;
                if (!isForwarded) {
                  if (m.type === 'file') {
                    try { fileMeta = JSON.parse(m.message); text = ''; isForwarded = !!fileMeta?.isForwarded; } catch(e) {}
                  } else {
                    try {
                      const parsed = JSON.parse(m.message);
                      if (parsed && typeof parsed === 'object' && 'isForwarded' in parsed) {
                        text = parsed.text || '';
                        isForwarded = true;
                      }
                    } catch (e) {
                      if (m.message && m.message.startsWith('[Forwarded]\n')) {
                        text = m.message.substring(12);
                        isForwarded = true;
                      }
                    }
                  }
                } else {
                  if (m.type === 'file') {
                    try { fileMeta = JSON.parse(m.message); text = ''; } catch(e) {}
                  }
                }
                return [
                  ...prev,
                  {
                    id: m.id,
                    senderId: m.created_by === companyUserId ? 'me' : m.created_by,
                    text,
                    file: fileMeta,
                    isForwarded,
                    timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    type: m.type || 'text',
                    createdAt: m.created_at,
                    readByUsers: m.read_by_users,
                    reactions: m.reaction_by_users || [],
                    isEdited: m.is_edited,
                    isDeleted: m.is_deleted,
                    isStarred: (m.star_by_users || []).some(s => {
                      const parsed = typeof s === 'string' ? JSON.parse(s) : s;
                      return parsed?.user_id === companyUserId;
                    }),
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
                if (msg.id === m.id) {
                  let fileMeta = null;
                  let text = m.message;
                  let isForwarded = m.is_forwarded || false;
                  if (!isForwarded) {
                    if (m.type === 'file') {
                      try { fileMeta = JSON.parse(m.message); text = ''; isForwarded = !!fileMeta?.isForwarded; } catch(e) {}
                    } else {
                      try {
                        const parsed = JSON.parse(m.message);
                        if (parsed && typeof parsed === 'object' && 'isForwarded' in parsed) {
                          text = parsed.text || '';
                          isForwarded = true;
                        }
                      } catch (e) {
                        if (m.message && m.message.startsWith('[Forwarded]\n')) {
                          text = m.message.substring(12);
                          isForwarded = true;
                        }
                      }
                    }
                  } else {
                    if (m.type === 'file') {
                      try { fileMeta = JSON.parse(m.message); text = ''; } catch(e) {}
                    }
                  }
                  return { 
                    ...msg, 
                    text,
                    file: fileMeta,
                    isForwarded,
                    readByUsers: m.read_by_users, 
                    reactions: m.reaction_by_users || [],
                    isEdited: m.is_edited,
                    isDeleted: m.is_deleted,
                    isStarred: (m.star_by_users || []).some(s => {
                      const parsed = typeof s === 'string' ? JSON.parse(s) : s;
                      return parsed?.user_id === companyUserId;
                    }),
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
            const exists = prev.some(c => c.roomId === m.room_id);
            if (!exists) {
              if (m.room_id) {
                supabase
                  .from('chat_rooms')
                  .select('*')
                  .eq('id', m.room_id)
                  .single()
                  .then(async ({ data: room }) => {
                    if (!room) return;
                    // Fix: Ensure we are actually a participant in this room before adding it!
                    if (room.participants && !room.participants.includes(companyUserId)) return;
                    
                    let newContact = null;
                    
                    if (room.type === 'group') {
                      let fileLabel = 'sent a file';
                      if (m.type === 'file') {
                        try {
                          const fileMeta = typeof m.message === 'string' ? JSON.parse(m.message) : m.message;
                          if (fileMeta?.type?.startsWith('image/')) {
                            fileLabel = 'sent an image';
                          }
                        } catch (e) {}
                      }

                      newContact = {
                        id: room.id,
                        roomId: room.id,
                        name: room.name || 'Group Chat',
                        initials: (room.name || 'GC').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2),
                        color: getUserColor(room.id),
                        status: null,
                        role: 'Channel',
                        lastMessage: m.type === 'file' ? fileLabel : m.message.replace(/\*([^*]+)\*/g, '$1').replace(/_([^_]+)_/g, '$1'),
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
                          let fileLabel = 'sent a file';
                          if (m.type === 'file') {
                            try {
                              const fileMeta = typeof m.message === 'string' ? JSON.parse(m.message) : m.message;
                              if (fileMeta?.type?.startsWith('image/')) {
                                  fileLabel = 'sent an image';
                              }
                            } catch (e) {}
                          }

                          newContact = {
                            id: cu.id,
                            roomId: room.id,
                            name: `${cu.users?.first_name || ''} ${cu.users?.last_name || ''}`.trim() || 'Colleague',
                            initials: `${cu.users?.first_name?.[0] || ''}${cu.users?.last_name?.[0] || ''}`.toUpperCase() || '?',
                            color: getUserColor(cu.id),
                            status: cu.is_active ? 'online' : 'offline',
                            role: cu.department || cu.designation || 'Colleague',
                            lastSeen: cu.is_active ? 'Online' : 'Offline',
                            lastMessage: m.type === 'file' ? fileLabel : m.message.replace(/\*([^*]+)\*/g, '$1').replace(/_([^_]+)_/g, '$1'),
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
                        
                        const existingIdx = latest.findIndex(x => !x.isChannel && x.id === newContact.id);
                        if (existingIdx !== -1) {
                          const updated = [...latest];
                          updated[existingIdx] = { ...updated[existingIdx], ...newContact };
                          return sortContacts(updated);
                        }
                        
                        return sortContacts([newContact, ...latest]);
                      });
                    }
                  });
              }
              return prev;
            }

            const updated = prev.map(c => {
              if (c.roomId === m.room_id) {
                let isForwarded = m.is_forwarded || false;
                let text = m.message;
                if (m.type === 'file') {
                  try {
                    const fileMeta = typeof m.message === 'string' ? JSON.parse(m.message) : m.message;
                    const isImg = fileMeta?.type?.startsWith('image/');
                    text = `sent a ${isImg ? 'image' : 'file'}`;
                  } catch (e) {
                    text = 'sent a file';
                  }
                } else {
                  if (!isForwarded && text) {
                    try {
                      const parsed = JSON.parse(text);
                      if (parsed && typeof parsed === 'object' && 'isForwarded' in parsed) {
                        text = parsed.text || '';
                        isForwarded = true;
                      }
                    } catch (e) {
                      if (text.startsWith('[Forwarded]\n')) {
                        text = text.substring(12);
                        isForwarded = true;
                      }
                    }
                  }
                  text = text
                    .replace(/\*([^*]+)\*/g, '$1')
                    .replace(/_([^_]+)_/g, '$1');
                }
                
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
            supabase.from('chat_rooms').select('participants').eq('id', m.room_id).single().then(({ data: roomData }) => {
              if (roomData && roomData.participants && roomData.participants.includes(companyUserId)) {
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
            });
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

  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const { data: msg, error: fetchErr } = await supabase
        .from('chat_messages')
        .select('reaction_by_users')
        .eq('id', messageId)
        .single();

      if (fetchErr) throw fetchErr;

      let currentReactions = msg.reaction_by_users || [];
      
      const existingIdx = currentReactions.findIndex(r => {
        const parsed = typeof r === 'string' ? JSON.parse(r) : r;
        return parsed?.user_id === companyUserId;
      });

      let updatedReactions = [];
      if (existingIdx !== -1) {
        const parsed = typeof currentReactions[existingIdx] === 'string'
          ? JSON.parse(currentReactions[existingIdx])
          : currentReactions[existingIdx];

        if (parsed?.reaction === emoji) {
          updatedReactions = currentReactions.filter((_, idx) => idx !== existingIdx);
        } else {
          updatedReactions = [...currentReactions];
          updatedReactions[existingIdx] = { user_id: companyUserId, reaction: emoji, reacted_at: new Date().toISOString() };
        }
      } else {
        updatedReactions = [...currentReactions, { user_id: companyUserId, reaction: emoji, reacted_at: new Date().toISOString() }];
      }

      const { error: updateErr } = await supabase
        .from('chat_messages')
        .update({ reaction_by_users: updatedReactions })
        .eq('id', messageId);

      if (updateErr) throw updateErr;

      setAllMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, reactions: updatedReactions };
        }
        return m;
      }));

    } catch (err) {
      console.error("Error in handleToggleReaction:", err);
    }
  };

  const handleEditMessage = async (messageId, newText) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ message: newText, is_edited: true, updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;

      setAllMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, text: newText, isEdited: true };
        }
        return m;
      }));
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;

      setAllMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, isDeleted: true };
        }
        return m;
      }));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleToggleStar = async (messageId) => {
    try {
      const { data: msg, error: fetchErr } = await supabase
        .from('chat_messages')
        .select('star_by_users')
        .eq('id', messageId)
        .single();

      if (fetchErr) throw fetchErr;

      let currentStars = msg.star_by_users || [];
      const exists = currentStars.some(s => {
        const parsed = typeof s === 'string' ? JSON.parse(s) : s;
        return parsed?.user_id === companyUserId;
      });

      let updatedStars = [];
      if (exists) {
        updatedStars = currentStars.filter(s => {
          const parsed = typeof s === 'string' ? JSON.parse(s) : s;
          return parsed?.user_id !== companyUserId;
        });
      } else {
        updatedStars = [...currentStars, { user_id: companyUserId }];
      }

      const { error: updateErr } = await supabase
        .from('chat_messages')
        .update({ star_by_users: updatedStars })
        .eq('id', messageId);

      if (updateErr) throw updateErr;

      setAllMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, isStarred: !exists };
        }
        return m;
      }));

      setChatAlert({
        type: 'success',
        message: exists ? 'Message unstarred' : 'Message starred'
      });
    } catch (err) {
      console.error("Error toggling star:", err);
    }
  };

  const handleCreateGroup = async (name, participantIds) => {
    try {
      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({
          type: 'group',
          name,
          participants: [companyUserId, ...participantIds],
          created_by: companyUserId,
          typing_participants: []
        })
        .select()
        .single();
      
      if (error) throw error;
      return newRoom;
    } catch (err) {
      console.error("Error creating group:", err);
      throw err;
    }
  };

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
    chatAlert, setChatAlert,
    editingMessage, setEditingMessage,
    quoteMessage, setQuoteMessage,
    forwardingMessage, setForwardingMessage,
    handleSend, handleFileUpload, handleSelect, sendTypingStatus, handleCreateGroup, handleToggleReaction,
    handleEditMessage, handleDeleteMessage, handleToggleStar, handleForwardMessage
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
