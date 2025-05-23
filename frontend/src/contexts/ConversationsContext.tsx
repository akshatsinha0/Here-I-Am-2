import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import socketService from '../services/SocketService';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  text: string; // Enforce text as string
  senderId: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
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
  unreadCount: number;
  avatar: string;
  isGroup: boolean;
  isSelfChat?: boolean;
}

interface ConversationsContextType {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Record<string, Message[]>;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (conversationId: string, text: string, replyTo?: Message) => Promise<void>;
  startNewConversation: (targetUserId: string, targetUsername: string, targetAvatar: string, isSelfChat?: boolean) => Promise<string | null>;
  loadMessages: (conversationId: string) => void;
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

  const handleServerAck = useCallback((tempId: string, serverId: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === tempId ? { ...conv, id: serverId } : conv
      )
    );
    setMessages(prev => {
      const newMessages = { ...prev };
      newMessages[serverId] = newMessages[tempId] || [];
      delete newMessages[tempId];
      return newMessages;
    });
    setPendingConversations(prev => {
      const newPending = { ...prev };
      delete newPending["self"];
      return newPending;
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const handleNewConversation = (conversation: Conversation) => {
      if (conversation.isSelfChat) {
        const pendingTempId = pendingConversations["self"];
        if (pendingTempId) {
          handleServerAck(pendingTempId, conversation.id);
        }
      }

      setConversations(prev => {
        if (prev.some(c => c.id === conversation.id)) return prev;
        return [...prev, conversation];
      });
    };

    const handleConversationUpdated = (data: { 
      conversationId: string, 
      lastMessage?: string,
      lastMessageTime?: string,
      unreadCount?: number
    }) => {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === data.conversationId ? {
            ...conv,
            lastMessage: data.lastMessage || conv.lastMessage,
            lastMessageTime: data.lastMessageTime || conv.lastMessageTime,
            unreadCount: data.unreadCount ?? conv.unreadCount
          } : conv
        )
      );
    };

    const handleNewMessage = (data: { conversationId: string, message: Message }) => {
      setMessages(prev => ({
        ...prev,
        [data.conversationId]: [...(prev[data.conversationId] || []), data.message]
      }));
    };

    const handleConversationMessages = (data: { conversationId: string, messages: Message[] }) => {
      setMessages(prev => ({
        ...prev,
        [data.conversationId]: data.messages
      }));
    };

    socketService.on('new_conversation', handleNewConversation);
    socketService.on('conversation_updated', handleConversationUpdated);
    socketService.on('new_message', handleNewMessage);
    socketService.on('conversation_messages', handleConversationMessages);

    return () => {
      socketService.off('new_conversation', handleNewConversation);
      socketService.off('conversation_updated', handleConversationUpdated);
      socketService.off('new_message', handleNewMessage);
      socketService.off('conversation_messages', handleConversationMessages);
    };
  }, [isAuthenticated, currentUser, handleServerAck, pendingConversations]);

  useEffect(() => {
    if (activeConversation && currentUser) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversation ? { ...conv, unreadCount: 0 } : conv
        )
      );

      const markRead = () => {
        socketService.emit('mark_read', { 
          conversationId: activeConversation,
          userId: currentUser.id 
        });
      };

      if (!messages[activeConversation]?.length) {
        loadMessages(activeConversation);
        markRead();
      } else {
        markRead();
      }
    }
  }, [activeConversation, currentUser, messages]);

  const sendMessage = useCallback(async (conversationId: string, text: string, replyTo?: Message) => {
    if (!currentUser) return;

    const messageData = {
      text: text, // Ensure text is always a string
      senderId: currentUser.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent' as const,
      replyTo: replyTo ? {
        id: replyTo.id,
        text: replyTo.text,
        senderId: replyTo.senderId
      } : undefined
    };

    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation?.isSelfChat && conversationId.startsWith('temp-')) {
      const newMessage = {
        ...messageData,
        id: Date.now().toString()
      };

      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage]
      }));

      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: text,
              lastMessageTime: newMessage.timestamp
            };
          }
          return conv;
        })
      );
      return;
    }

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
  }, [conversations, currentUser]);

  const startNewConversation = useCallback(async (
    targetUserId: string,
    targetUsername: string,
    targetAvatar: string,
    isSelfChat: boolean = false
  ) => {
    if (!currentUser) return null;

    if (isSelfChat) {
      const existingSelfChat = conversations.find(conv => 
        conv.isSelfChat && conv.participants.includes(currentUser.id)
      );
      if (existingSelfChat) return existingSelfChat.id;

      const tempId = `temp-${Date.now()}`;
      const tempConversation = {
        id: tempId,
        participants: [currentUser.id],
        name: "Yourself",
        avatar: currentUser.avatar,
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0,
        isGroup: false,
        isSelfChat: true
      };

      setConversations(prev => [...prev, tempConversation]);
      setPendingConversations(prev => ({ ...prev, "self": tempId }));

      try {
        const serverId = await new Promise<string>((resolve, reject) => {
          socketService.emit('start_conversation', {
            userId: currentUser.id,
            targetUserId: currentUser.id,
            targetUsername,
            targetAvatar,
            isSelfChat: true
          }, (response: { conversationId: string }) => {
            if (response?.conversationId) {
              resolve(response.conversationId);
            } else {
              reject(new Error('Conversation creation failed'));
            }
          });
        });

        handleServerAck(tempId, serverId);
        return serverId;
      } catch (error) {
        console.error('Conversation creation error:', error);
        setConversations(prev => prev.filter(conv => conv.id !== tempId));
        throw error;
      }
    }

    return new Promise<string | null>((resolve) => {
      socketService.emit('start_conversation', {
        userId: currentUser.id,
        targetUserId,
        targetUsername,
        targetAvatar
      });
      resolve(null);
    });
  }, [currentUser, conversations, handleServerAck]);

  const loadMessages = useCallback((conversationId: string) => {
    socketService.emit('get_messages', conversationId);
  }, []);

  const value = {
    conversations,
    activeConversation,
    messages,
    setActiveConversation,
    sendMessage,
    startNewConversation,
    loadMessages
  };

  return <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>;
};
