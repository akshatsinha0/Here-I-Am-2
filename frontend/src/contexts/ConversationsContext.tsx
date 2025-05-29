import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import socketService from '../services/SocketService';
import { useAuth } from './AuthContext';
import { isValidObjectId } from '../utils/validation';
import { v4 } from 'uuid';


interface Message {
  id: string;
  conversationId: string;
  text: string;
  senderId: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  readBy: string[];
  replyTo?: {
    id: string;
    text: string;
    senderId: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: Map<string, number>;
  avatar: string;
  isGroup: boolean;
  isSelfChat?: boolean;
  isPinned?: boolean;
  latestMessage?: Message;
}

interface ConversationsContextType {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Record<string, Message[]>;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (conversationId: string, text: string, replyTo?: Message) => Promise<void>;
  startNewConversation: (targetUserId: string, targetUsername: string, targetAvatar: string, isSelfChat?: boolean) => Promise<string | null>;
  loadMessages: (conversationId: string) => Promise<void>;
  markAsRead: (conversationId: string, messageIds: string[]) => Promise<void>;
  pinConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  getUnreadCount: (conversationId: string) => number;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationsProvider');
  }
  return context;
};

interface ConversationsProviderProps {
  children: ReactNode;
}

export const ConversationsProvider = ({ children }: ConversationsProviderProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [pendingConversations, setPendingConversations] = useState<Record<string, string>>({});
  const { currentUser, isAuthenticated } = useAuth();

  // Helper function to find existing conversation
  const findExistingConversation = useCallback((targetUserId: string, isSelfChat: boolean = false): Conversation | null => {
    if (!currentUser) return null;
    
    return conversations.find(conv => {
      if (isSelfChat) {
        return conv.isSelfChat && conv.participants.includes(currentUser.id);
      }
      return !conv.isSelfChat && !conv.isGroup && 
             conv.participants.includes(currentUser.id) && 
             conv.participants.includes(targetUserId);
    }) || null;
  }, [conversations, currentUser]);

  const handleServerAck = useCallback((tempId: string, serverId: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === tempId ? { ...conv, id: serverId } : conv
      )
    );
    setMessages(prev => ({
      ...prev,
      [serverId]: prev[tempId] || [],
    }));
    setPendingConversations(prev => ({
      ...prev,
      [tempId]: serverId
    }));
  }, []);

  useEffect(() => {
   // In the useEffect loading conversations
const loadConversations = async () => {
  if (!currentUser?.id) return;
  
  try {
    // WRONG URL: ❌ /api/messages/conversations/...
    // CORRECT URL: ✅ /api/conversations/user/...
    const response = await fetch(`/api/conversations/user/${currentUser.id}`);
    
    if (response.ok) {
      const conversationsData = await response.json();
      
      // Properly handle participant IDs and unreadCount
      const formattedConversations = conversationsData.map((conv: any) => ({
        ...conv,
        unreadCount: new Map(Object.entries(conv.unreadCount)),
        participants: conv.participants.map((p: any) => p._id || p.id), // Handle both _id and id
        latestMessage: conv.latestMessage?._id || conv.latestMessage?.id
      }));

      setConversations(formattedConversations);
      
      // Reload messages for active conversation if needed
      if (activeConversation) {
        await loadMessages(activeConversation);
      }
    }
  } catch (error) {
    console.error('Failed to load conversations:', error);
  }
};


    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, currentUser?.id]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const handleNewConversation = (conversation: Conversation) => {
      setConversations(prev => {
        const exists = prev.some(c => c.id === conversation.id);
        return exists ? prev : [...prev, {
          ...conversation,
          unreadCount: new Map(Object.entries(conversation.unreadCount))
        }];
      });
    };

    const handleConversationUpdated = (data: { 
      conversationId: string, 
      latestMessage?: Message,
      unreadCount?: Record<string, number>,
      isPinned?: boolean
    }) => {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === data.conversationId ? {
            ...conv,
            latestMessage: data.latestMessage,
            lastMessage: data.latestMessage?.text,
            lastMessageTime: data.latestMessage?.timestamp,
            unreadCount: data.unreadCount ? new Map(Object.entries(data.unreadCount)) : conv.unreadCount,
            isPinned: data.isPinned ?? conv.isPinned
          } : conv
        )
      );
    };

    const handleNewMessage = (data: { conversationId: string, message: Message }) => {
      setMessages(prev => {
        const existingMessages = prev[data.conversationId] || [];
        const exists = existingMessages.some(msg => msg.id === data.message.id);
        
        return exists ? prev : {
          ...prev,
          [data.conversationId]: [...existingMessages, data.message]
        };
      });

      if (data.message.senderId !== currentUser.id) {
        setConversations(prev => 
          prev.map(conv => {
            if (conv.id === data.conversationId) {
              const newUnread = new Map(conv.unreadCount);
              const currentCount = newUnread.get(currentUser.id) || 0;
              newUnread.set(currentUser.id, currentCount + 1);
              return { ...conv, unreadCount: newUnread };
            }
            return conv;
          })
        );
      }
    };

    const handleMessagesRead = (data: { conversationId: string, userId: string, messageIds: string[] }) => {
      setMessages(prev => ({
        ...prev,
        [data.conversationId]: prev[data.conversationId]?.map(msg => 
          data.messageIds.includes(msg.id) ? { ...msg, readBy: [...msg.readBy, data.userId] } : msg
        ) || []
      }));
    };

    const handleConversationMessages = (data: { conversationId: string, messages: Message[] }) => {
      setMessages(prev => {
        const existingMessages = prev[data.conversationId] || [];
        const uniqueNewMessages = data.messages.filter(newMsg => 
          !existingMessages.some(existingMsg => existingMsg.id === newMsg.id)
        );
        
        return {
          ...prev,
          [data.conversationId]: [...existingMessages, ...uniqueNewMessages]
        };
      });
    };

    const handleConversationDeleted = (data: { conversationId: string }) => {
      setConversations(prev => prev.filter(conv => conv.id !== data.conversationId));
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[data.conversationId];
        return newMessages;
      });
      
      if (activeConversation === data.conversationId) {
        setActiveConversation(null);
      }
    };

    socketService.on('new_conversation', handleNewConversation);
    socketService.on('conversation_updated', handleConversationUpdated);
    socketService.on('new_message', handleNewMessage);
    socketService.on('messages_read', handleMessagesRead);
    socketService.on('conversation_messages', handleConversationMessages);
    socketService.on('conversation_deleted', handleConversationDeleted);

    return () => {
      socketService.off('new_conversation', handleNewConversation);
      socketService.off('conversation_updated', handleConversationUpdated);
      socketService.off('new_message', handleNewMessage);
      socketService.off('messages_read', handleMessagesRead);
      socketService.off('conversation_messages', handleConversationMessages);
      socketService.off('conversation_deleted', handleConversationDeleted);
    };
  }, [isAuthenticated, currentUser, activeConversation]);

  useEffect(() => {
    if (activeConversation && currentUser) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversation ? {
            ...conv,
            unreadCount: new Map(conv.unreadCount).set(currentUser.id, 0)
          } : conv
        )
      );

      if (!messages[activeConversation]?.length) {
        loadMessages(activeConversation);
      }
    }
  }, [activeConversation, currentUser, messages]);

  const sendMessage = useCallback(async (conversationId: string, text: string, replyTo?: Message) => {
    if (!currentUser) return;

    const messageData = {
      text,
      senderId: currentUser.id,
      timestamp: new Date().toISOString(),
      status: 'sent' as const,
      replyTo: replyTo ? {
        id: replyTo.id,
        text: replyTo.text,
        senderId: replyTo.senderId
      } : undefined
    };

    try {
      await socketService.emit('send_message', {
        conversationId,
        message: messageData,
        senderId: currentUser.id
      });
    } catch (error) {
      console.error('Message send error:', error);
      throw error;
    }
  }, [currentUser]);

  const startNewConversation = useCallback(async (
    targetUserId: string,
    targetUsername: string,
    targetAvatar: string,
    isSelfChat: boolean = false
  ) => {
    if (!currentUser) return null;

    const existingConversation = findExistingConversation(targetUserId, isSelfChat);
    if (existingConversation) return existingConversation.id;

    if (isSelfChat) {
      return new Promise<string>((resolve, reject) => {
        socketService.emit('start_conversation', {
          userId: currentUser.id,
          targetUserId: currentUser.id,
          targetUsername,
          targetAvatar,
          isSelfChat: true
        }, (response: { conversationId: string; existing?: boolean }) => {
          if (response?.conversationId) {
            if (!response.existing) {
              const newConversation: Conversation = {
                id: response.conversationId,
                name: "Yourself",
                participants: [currentUser.id],
                avatar: targetAvatar,
                unreadCount: new Map(),
                isGroup: false,
                isSelfChat: true,
                isPinned: false
              };
              setConversations(prev => [...prev, newConversation]);
            }
            resolve(response.conversationId);
          } else {
            reject(new Error('Failed to create self chat'));
          }
        });
      });
    }

    return new Promise<string>((resolve, reject) => {
      const pendingKey = `${currentUser.id}-${targetUserId}`;
      if (pendingConversations[pendingKey]) {
        reject(new Error('Conversation creation already in progress'));
        return;
      }
      const tempId = v4().replace(/-/g, '').substring(0, 24);
      setPendingConversations(prev => ({ ...prev, [pendingKey]: tempId }));
      
      const tempConversation: Conversation = {
        id: tempId,
        name: targetUsername,
        participants: [currentUser.id, targetUserId],
        avatar: targetAvatar,
        unreadCount: new Map(),
        isGroup: false,
        isPinned: false
      };

      setConversations(prev => [...prev, tempConversation]);

      socketService.emit('start_conversation', {
        userId: currentUser.id,
        targetUserId,
        targetUsername,
        targetAvatar
      }, (response: { conversationId: string; existing?: boolean }) => {
        setPendingConversations(prev => {
          const newPending = { ...prev };
          delete newPending[pendingKey];
          return newPending;
        });

        if (response?.conversationId) {
          if (response.existing) {
            setConversations(prev => prev.filter(c => c.id !== tempId));
          } else {
            handleServerAck(tempId, response.conversationId);
          }
          resolve(response.conversationId);
        } else {
          setConversations(prev => prev.filter(c => c.id !== tempId));
          reject(new Error('Failed to start conversation'));
        }
      });
    });
  }, [currentUser, findExistingConversation, handleServerAck, pendingConversations]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      if (!isValidObjectId(conversationId)) {
        throw new Error('Invalid conversation ID');
      }
      const response = await fetch(`/api/messages/${conversationId}`);
      if (!response.ok) throw new Error('Failed to load messages');
      const newMessages = await response.json();
      
      setMessages(prev => {
        const existingMessages = prev[conversationId] || [];
        const uniqueNewMessages = newMessages.filter((newMsg: Message) => 
          !existingMessages.some(existingMsg => existingMsg.id === newMsg.id)
        );
        
        return {
          ...prev,
          [conversationId]: [...existingMessages, ...uniqueNewMessages]
        };
      });
    } catch (error) {
      console.error('Load messages error:', error);
      throw error;
    }
  }, []);

  const markAsRead = useCallback(async (conversationId: string, messageIds: string[]) => {
    if (!currentUser) return;

    try {
      setMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId]?.map(msg => 
          messageIds.includes(msg.id) ? { ...msg, readBy: [...msg.readBy, currentUser.id] } : msg
        ) || []
      }));

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? {
            ...conv,
            unreadCount: new Map(conv.unreadCount).set(currentUser.id, 0)
          } : conv
        )
      );

      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationId,
          messageIds,
          userId: currentUser.id 
        })
      });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  }, [currentUser]);

  const pinConversation = useCallback(async (conversationId: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, isPinned: !conv.isPinned } : conv
      )
    );
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    setMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[conversationId];
      return newMessages;
    });
    if (activeConversation === conversationId) setActiveConversation(null);
  }, [activeConversation]);

  const getUnreadCount = useCallback((conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    return conversation?.unreadCount.get(currentUser?.id || '') || 0;
  }, [conversations, currentUser]);

  const value = {
    conversations,
    activeConversation,
    messages,
    setActiveConversation,
    sendMessage,
    startNewConversation,
    loadMessages,
    markAsRead,
    pinConversation,
    deleteConversation,
    getUnreadCount
  };

  return <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>;
}