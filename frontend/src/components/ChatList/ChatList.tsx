import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEdit, FiMoreVertical, FiPlus, FiStar } from 'react-icons/fi';
import { useConversations } from '../../contexts/ConversationsContext';
import { useOnlineUsers } from '../../contexts/OnlineUsersContext';
import { useAuth } from '../../contexts/AuthContext';
import './ChatList.css';

const generateTempId = () => {
  return Array.from({length: 24}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

const ChatList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const { 
    conversations, 
    setActiveConversation, 
    activeConversation,
    markAsRead,
    pinConversation,
    deleteConversation,
    getUnreadCount,
    startNewConversation
  } = useConversations();
  const { isUserOnline } = useOnlineUsers();
  const { isAuthenticated, currentUser } = useAuth();

  const processedConversations = useMemo(() => {
    if (!currentUser) return [];

    const uniqueConversations = new Map();
    
    conversations.forEach(conv => {
      let conversationKey;
      
      if (conv.isSelfChat) {
        conversationKey = `self-${currentUser.id}`;
      } else if (conv.isGroup) {
        conversationKey = `group-${conv.participants.sort().join('-')}`;
      } else if (conv.isBot) {
        conversationKey = `bot-${currentUser.id}`;
      } else {
        const sortedParticipants = [...conv.participants].sort();
        conversationKey = `chat-${sortedParticipants.join('-')}`;
      }

      if (!uniqueConversations.has(conversationKey) || 
          (conv.lastMessageTime && conv.lastMessageTime > (uniqueConversations.get(conversationKey)?.lastMessageTime || ''))) {
        uniqueConversations.set(conversationKey, conv);
      }
    });

    return Array.from(uniqueConversations.values()).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const timeA = new Date(a.lastMessageTime || a.id || 0).getTime();
      const timeB = new Date(b.lastMessageTime || b.id || 0).getTime();
      return timeB - timeA;
    });
  }, [conversations, currentUser]);

  const filteredChats = useMemo(() => {
    return processedConversations.filter(chat => 
      chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getLastMessageText(chat.lastMessage).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedConversations, searchTerm]);

  const getLastMessageText = (lastMessage: any) => {
    if (!lastMessage) return 'Start a conversation';
    if (typeof lastMessage === 'string') return lastMessage || 'Start a conversation';
    if (lastMessage?.text) return lastMessage.text;
    return 'Start a conversation';
  };

  const formatMessageTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    
    try {
      const messageDate = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - messageDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return '';
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveConversation(chatId);
    setShowActions(null);
  };

  const handleBackdropClick = () => {
    setShowActions(null);
  };

  const handleMarkAsRead = async (chatId: string) => {
    setActionLoading(chatId);
    try {
      if (markAsRead) {
        await markAsRead(chatId, []); // Pass empty array to mark all as read
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    } finally {
      setActionLoading(null);
      setShowActions(null);
    }
  };

  const handlePinConversation = async (chatId: string) => {
    setActionLoading(chatId);
    try {
      if (pinConversation) {
        await pinConversation(chatId);
      }
    } catch (error) {
      console.error('Failed to pin conversation:', error);
    } finally {
      setActionLoading(null);
      setShowActions(null);
    }
  };

  const handleDeleteConversation = async (chatId: string) => {
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      setActionLoading(chatId);
      try {
        if (deleteConversation) {
          await deleteConversation(chatId);
          if (activeConversation === chatId) {
            setActiveConversation(null);
          }
        }
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      } finally {
        setActionLoading(null);
        setShowActions(null);
      }
    } else {
      setShowActions(null);
    }
  };

  const createBotConversation = async () => {
    if (!currentUser) return;
    
    const botConversation = {
      id: generateTempId(),
      name: "AI Assistant 🤖",
      participants: [currentUser.id, 'bot'],
      avatar: '/bot-avatar.png',
      isBot: true,
      isSelfChat: false,
      isGroup: false,
      unreadCount: new Map(),
      latestMessage: undefined
    };

    try {
      await startNewConversation(
        'bot',
        "AI Assistant 🤖",
        "/bot-avatar.png",
        false,
        true
      );
      setActiveConversation(botConversation.id);
    } catch (error) {
      console.error('Failed to create bot conversation:', error);
    }
  };

  return (
    <div className="chat-list" onClick={handleBackdropClick}>
      <div className="chat-list-header">
        <h2>Conversations</h2>
        <motion.button 
          className="new-chat-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNewChatModal(true)}
          title="New conversation"
        >
          <FiEdit />
        </motion.button>
      </div>

      <div className="search-container">
        <FiSearch className="search-icon" />
        <input 
          type="text" 
          placeholder="Search conversations..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="chats-container">
        {!isAuthenticated && (
          <div className="not-authenticated-message">
            Please sign in to view your conversations
          </div>
        )}

        {isAuthenticated && filteredChats.length === 0 && !searchTerm && (
          <div className="no-chats-message">
            No conversations yet. Start chatting with someone from the online users list.
          </div>
        )}

        {isAuthenticated && filteredChats.length === 0 && searchTerm && (
          <div className="no-chats-message">
            No conversations match "{searchTerm}"
          </div>
        )}

        <AnimatePresence>
          {isAuthenticated && filteredChats.map(chat => {
            const otherParticipantId = !chat.isGroup && !chat.isSelfChat && !chat.isBot
              ? chat.participants.find(id => id !== currentUser?.id) 
              : null;
            const isOnline = otherParticipantId ? isUserOnline(otherParticipantId) : false;
            const lastMessageText = getLastMessageText(chat.lastMessage);
            const formattedTime = formatMessageTime(chat.lastMessageTime);
            const isActionLoading = actionLoading === chat.id;
            const unreadCount = getUnreadCount(chat.id);

            return (
              <motion.div 
                key={chat.id}
                className={`chat-item ${activeConversation === chat.id ? 'selected' : ''} ${chat.isPinned ? 'pinned' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectChat(chat.id);
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <div className="chat-avatar">
                  {chat.avatar && chat.avatar !== '/default-avatar.png' ? (
                    <img src={chat.avatar} alt={chat.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {chat.isGroup ? (
                        <div className="group-avatar">{chat.name.substring(0, 1).toUpperCase()}</div>
                      ) : chat.isBot ? (
                        <div className="bot-avatar">🤖</div>
                      ) : (
                        <div className="user-avatar-text">
                          {chat.name.split(' ').map(n => n[0]?.toUpperCase() || '').join('').substring(0, 2)}
                        </div>
                      )}
                    </div>
                  )}
                  {!chat.isGroup && !chat.isSelfChat && !chat.isBot && isOnline && (
                    <div className="online-indicator" title="Online"></div>
                  )}
                  {chat.isSelfChat && (
                    <div className="self-chat-indicator" title="Self chat"></div>
                  )}
                  {chat.isBot && (
                    <div className="bot-indicator" title="AI Assistant"></div>
                  )}
                  {chat.isPinned && (
                    <div className="pin-indicator" title="Pinned">
                      <FiStar />
                    </div>
                  )}
                </div>
                
                <div className="chat-details">
                  <div className="chat-header">
                    <h3 className="chat-name" title={chat.name}>
                      {chat.name}
                      {chat.isSelfChat && <span className="self-indicator">(You)</span>}
                      {chat.isPinned && <FiStar className="pin-icon" />}
                    </h3>
                    {formattedTime && (
                      <span className="chat-time" title={chat.lastMessageTime}>
                        {formattedTime}
                      </span>
                    )}
                  </div>
                  <div className="chat-message-preview">
                    <p title={lastMessageText}>{lastMessageText}</p>
                    {unreadCount > 0 && (
                      <span className="unread-badge" title={`${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                
                <motion.button 
                  className="chat-menu-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(showActions === chat.id ? null : chat.id);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="More options"
                  disabled={isActionLoading}
                >
                  <FiMoreVertical />
                </motion.button>
                
                <AnimatePresence>
                  {showActions === chat.id && (
                    <motion.div 
                      className="chat-actions"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => handleMarkAsRead(chat.id)}
                        disabled={isActionLoading || unreadCount === 0}
                        className={unreadCount === 0 ? 'disabled' : ''}
                      >
                        {isActionLoading ? 'Marking...' : 'Mark as read'}
                      </button>
                      <button 
                        onClick={() => handlePinConversation(chat.id)}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? 'Processing...' : (chat.isPinned ? 'Unpin conversation' : 'Pin conversation')}
                      </button>
                      <button 
                        className="delete-action"
                        onClick={() => handleDeleteConversation(chat.id)}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? 'Deleting...' : 'Delete'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showNewChatModal && (
          <motion.div 
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div 
              className="new-chat-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h2>New Conversation</h2>
              <div className="modal-options">
                <motion.button 
                  className="modal-option"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowNewChatModal(false);
                    createBotConversation();
                  }}
                >
                  <div className="option-icon ai-icon">
                    <span role="img" aria-label="robot">🤖</span>
                  </div>
                  <span>AI Assistant</span>
                </motion.button>
                <motion.button 
                  className="modal-option"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowNewChatModal(false);
                  }}
                >
                  <div className="option-icon">
                    <FiPlus />
                  </div>
                  <span>New Chat</span>
                </motion.button>
                <motion.button 
                  className="modal-option"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowNewChatModal(false);
                  }}
                >
                  <div className="option-icon group-icon">
                    <FiPlus />
                  </div>
                  <span>New Group</span>
                </motion.button>
              </div>
              <motion.button 
                className="close-modal"
                onClick={() => setShowNewChatModal(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatList;
