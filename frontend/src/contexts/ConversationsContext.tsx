import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import socketService from '../services/SocketService';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  text: string;
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
  isPinned?: boolean;
}

interface ConversationsContextType {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Record<string, Message[]>;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (conversationId: string, text: string, replyTo?: Message) => Promise<void>;
  startNewConversation: (targetUserId: string, targetUsername: string, targetAvatar: string, isSelfChat?: boolean) => Promise<string | null>;
  loadMessages: (conversationId: string) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  pinConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
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
    if (!isAuthenticated || !currentUser) return;

    const handleNewConversation = (conversation: Conversation) => {
      setConversations(prev => {
        const exists = prev.some(c => c.id === conversation.id);
        return exists ? prev : [...prev, conversation];
      });
    };

    const handleConversationUpdated = (data: { 
      conversationId: string, 
      lastMessage?: string,
      lastMessageTime?: string,
      unreadCount?: number,
      isPinned?: boolean
    }) => {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === data.conversationId ? {
            ...conv,
            lastMessage: data.lastMessage || conv.lastMessage,
            lastMessageTime: data.lastMessageTime || conv.lastMessageTime,
            unreadCount: data.unreadCount ?? conv.unreadCount,
            isPinned: data.isPinned ?? conv.isPinned
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

    const handleConversationDeleted = (data: { conversationId: string }) => {
      setConversations(prev => prev.filter(conv => conv.id !== data.conversationId));
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[data.conversationId];
        return newMessages;
      });
      
      // Clear active conversation if it was deleted
      if (activeConversation === data.conversationId) {
        setActiveConversation(null);
      }
    };

    socketService.on('new_conversation', handleNewConversation);
    socketService.on('conversation_updated', handleConversationUpdated);
    socketService.on('new_message', handleNewMessage);
    socketService.on('conversation_messages', handleConversationMessages);
    socketService.on('conversation_deleted', handleConversationDeleted);

    return () => {
      socketService.off('new_conversation', handleNewConversation);
      socketService.off('conversation_updated', handleConversationUpdated);
      socketService.off('new_message', handleNewMessage);
      socketService.off('conversation_messages', handleConversationMessages);
      socketService.off('conversation_deleted', handleConversationDeleted);
    };
  }, [isAuthenticated, currentUser, activeConversation]);

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
        }).catch(error => {
          console.error('Mark read error:', error);
        });
      };

      if (!messages[activeConversation]?.length) {
        loadMessages(activeConversation);
      }
      markRead();
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

    // Check for existing conversation first
    const existingConversation = findExistingConversation(targetUserId, isSelfChat);
    if (existingConversation) {
      console.log(`Found existing conversation: ${existingConversation.id}`);
      return existingConversation.id;
    }

    // Handle self chat
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
            // Add conversation to local state if it's new
            if (!response.existing) {
              const newConversation: Conversation = {
                id: response.conversationId,
                name: "Yourself",
                participants: [currentUser.id],
                avatar: targetAvatar,
                unreadCount: 0,
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

    // Handle regular conversation with duplicate prevention
    return new Promise<string>((resolve, reject) => {
      // Check if we're already creating a conversation with this user
      const pendingKey = `${currentUser.id}-${targetUserId}`;
      if (pendingConversations[pendingKey]) {
        reject(new Error('Conversation creation already in progress'));
        return;
      }

      const tempId = `temp-${Date.now()}`;
      
      // Mark as pending
      setPendingConversations(prev => ({ ...prev, [pendingKey]: tempId }));
      
      // Add temporary conversation
      const tempConversation: Conversation = {
        id: tempId,
        name: targetUsername,
        participants: [currentUser.id, targetUserId],
        avatar: targetAvatar,
        unreadCount: 0,
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
        // Clear pending state
        setPendingConversations(prev => {
          const newPending = { ...prev };
          delete newPending[pendingKey];
          return newPending;
        });

        if (response?.conversationId) {
          if (response.existing) {
            // Remove temp conversation and use existing one
            setConversations(prev => prev.filter(c => c.id !== tempId));
          } else {
            // Update temp conversation with server ID
            handleServerAck(tempId, response.conversationId);
          }
          resolve(response.conversationId);
        } else {
          // Remove temp conversation on failure
          setConversations(prev => prev.filter(c => c.id !== tempId));
          reject(new Error('Failed to start conversation'));
        }
      });
    });
  }, [currentUser, findExistingConversation, handleServerAck, pendingConversations]);

  const loadMessages = useCallback((conversationId: string) => {
    socketService.emit('get_messages', conversationId).catch(error => {
      console.error('Load messages error:', error);
    });
  }, []);

  // New method: Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser) return;

    try {
      // Update local state immediately for instant feedback
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );

      // Emit to server
      await socketService.emit('mark_read', { 
        conversationId,
        userId: currentUser.id 
      });

      console.log(`Marked conversation ${conversationId} as read`);
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      throw error;
    }
  }, [currentUser]);

  // New method: Pin/Unpin conversation
  const pinConversation = useCallback(async (conversationId: string) => {
    if (!currentUser) return;

    try {
      // Get current pin status
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (!conversation) throw new Error('Conversation not found');

      const newPinnedStatus = !conversation.isPinned;

      // Update local state immediately for instant feedback
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, isPinned: newPinnedStatus } : conv
        )
      );

      // Emit to server (if you want server-side persistence)
      await socketService.emit('pin_conversation', { 
        conversationId,
        userId: currentUser.id,
        isPinned: newPinnedStatus
      }).catch(() => {
        // Server doesn't handle pin yet, so we'll just keep it local
        console.log('Pin state saved locally');
      });

      console.log(`${newPinnedStatus ? 'Pinned' : 'Unpinned'} conversation ${conversationId}`);
    } catch (error) {
      console.error('Failed to pin/unpin conversation:', error);
      throw error;
    }
  }, [currentUser, conversations]);

  // New method: Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!currentUser) return;

    try {
      // Remove from local state immediately for instant feedback
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Remove messages from local state
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[conversationId];
        return newMessages;
      });

      // Clear active conversation if it was deleted
      if (activeConversation === conversationId) {
        setActiveConversation(null);
      }

      // Emit to server (if you want server-side deletion)
      await socketService.emit('delete_conversation', { 
        conversationId,
        userId: currentUser.id 
      }).catch(() => {
        // Server doesn't handle delete yet, so we'll just keep it local
        console.log('Conversation deleted locally');
      });

      console.log(`Deleted conversation ${conversationId}`);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      
      // Revert local state on error
      throw error;
    }
  }, [currentUser, activeConversation]);

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
    deleteConversation
  };

  return <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>;
};
