import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEdit, FiMoreVertical, FiPlus } from 'react-icons/fi';
import { useConversations } from '../../contexts/ConversationsContext';
import { useOnlineUsers } from '../../contexts/OnlineUsersContext';
import { useAuth } from '../../contexts/AuthContext';
import './ChatList.css';

const ChatList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  
  const { conversations, setActiveConversation, activeConversation } = useConversations();
  const { isUserOnline } = useOnlineUsers();
  const { isAuthenticated, currentUser } = useAuth();

  const filteredChats = conversations.filter(
    chat => chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLastMessageText = (lastMessage: any) => {
    if (typeof lastMessage === 'string') return lastMessage;
    if (lastMessage?.text) return lastMessage.text;
    return 'Start a conversation';
  };

  const handleSelectChat = (chatId: string) => {
    setActiveConversation(chatId);
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Conversations</h2>
        <motion.button 
          className="new-chat-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNewChatModal(true)}
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

        {isAuthenticated && filteredChats.length === 0 && (
          <div className="no-chats-message">
            No conversations yet. Start chatting with someone from the online users list.
          </div>
        )}

        <AnimatePresence>
          {isAuthenticated && filteredChats.map(chat => {
            const otherParticipantId = !chat.isGroup 
              ? chat.participants.find(id => id !== currentUser?.id) 
              : null;
            const isOnline = otherParticipantId ? isUserOnline(otherParticipantId) : false;

            return (
              <motion.div 
                key={chat.id}
                className={`chat-item ${activeConversation === chat.id ? 'selected' : ''}`}
                onClick={() => handleSelectChat(chat.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <div className="chat-avatar">
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {chat.isGroup ? 
                        <div className="group-avatar">{chat.name.substring(0, 1)}</div> : 
                        <div className="user-avatar-text">{chat.name.split(' ').map(n => n[0]).join('')}</div>
                      }
                    </div>
                  )}
                  {!chat.isGroup && isOnline && <div className="online-indicator"></div>}
                </div>
                <div className="chat-details">
                  <div className="chat-header">
                    <h3 className="chat-name">{chat.name}</h3>
                    <span className="chat-time">{chat.lastMessageTime || ''}</span>
                  </div>
                  <div className="chat-message-preview">
                    <p>{getLastMessageText(chat.lastMessage)}</p>
                    {chat.unreadCount > 0 && (
                      <span className="unread-badge">{chat.unreadCount}</span>
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
                      <button>Mark as read</button>
                      <button>Pin conversation</button>
                      <button className="delete-action">Delete</button>
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
