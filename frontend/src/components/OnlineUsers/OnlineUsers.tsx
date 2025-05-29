import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiMessageSquare } from 'react-icons/fi';
import { useOnlineUsers } from '../../contexts/OnlineUsersContext';
import { useConversations } from '../../contexts/ConversationsContext';
import { useAuth } from '../../contexts/AuthContext';
import './OnlineUsers.css';

const OnlineUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSelfChatDialog, setShowSelfChatDialog] = useState(false);
  const { onlineUsers, searchUsers } = useOnlineUsers();
  const { startNewConversation, setActiveConversation, conversations, getUnreadCount } = useConversations();
  const { isAuthenticated, currentUser } = useAuth();

  const handleStartChat = async (userId: string, username: string, avatar: string) => {
    try {
      // Check for existing conversation first
      const existingConv = conversations.find(conv => 
        !conv.isGroup && 
        !conv.isSelfChat && 
        conv.participants.includes(userId)
      );

      if (existingConv) {
        setActiveConversation(existingConv.id);
      } else {
        const conversationId = await startNewConversation(userId, username, avatar);
        if (conversationId) {
          setActiveConversation(conversationId);
        }
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleSelfChat = async () => {
    if (currentUser) {
      try {
        const existingSelfChat = conversations.find(conv => 
          conv.isSelfChat && conv.participants.includes(currentUser.id)
        );

        if (existingSelfChat) {
          setActiveConversation(existingSelfChat.id);
        } else {
          const conversationId = await startNewConversation(
            currentUser.id, 
            "Yourself", 
            currentUser.avatar, 
            true
          );
          if (conversationId) {
            setActiveConversation(conversationId);
          }
        }
      } catch (error) {
        console.error('Failed to start self chat:', error);
      } finally {
        setShowSelfChatDialog(false);
      }
    }
  };

  const searchResults = useMemo(() => 
    searchTerm ? searchUsers(searchTerm) : onlineUsers
  , [searchTerm, onlineUsers, searchUsers]);

  const selfProfile = useMemo(() => 
    currentUser ? {
      userId: currentUser.id,
      username: "Yourself",
      email: currentUser.email,
      avatar: currentUser.avatar,
      socketId: "",
      lastSeen: ""
    } : null
  , [currentUser]);

  const getConversationUnreadCount = (userId: string) => {
    const conversation = conversations.find(conv => 
      !conv.isGroup && 
      !conv.isSelfChat && 
      conv.participants.includes(userId)
    );
    return conversation ? getUnreadCount(conversation.id) : 0;
  };

  const getSelfChatUnreadCount = () => {
    const selfChat = conversations.find(conv => 
      conv.isSelfChat && conv.participants.includes(currentUser?.id || '')
    );
    return selfChat ? getUnreadCount(selfChat.id) : 0;
  };

  return (
    <div className="online-users">
      <div className="online-users-header">
        <h2>Online Contacts</h2>
      </div>

      <div className="user-search-container">
        <FiSearch className="user-search-icon" />
        <input 
          type="text" 
          placeholder="Search contacts..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="user-search-input"
        />
      </div>

      <div className="users-list">
        {!isAuthenticated && (
          <div className="not-authenticated-message">
            Please sign in to see online users
          </div>
        )}

        {isAuthenticated && selfProfile && (
          <motion.div 
            className="user-item self-profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="user-avatar-container">
              <div className="user-avatar">
                {selfProfile.avatar ? (
                  <img src={selfProfile.avatar} alt={selfProfile.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {selfProfile.username.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              {getSelfChatUnreadCount() > 0 && (
                <div className="unread-badge">
                  {getSelfChatUnreadCount() > 99 ? '99+' : getSelfChatUnreadCount()}
                </div>
              )}
            </div>
            
            <div className="user-info">
              <h3>{selfProfile.username}</h3>
              <p>{selfProfile.email}</p>
            </div>
            
            <motion.button 
              className="add-chat-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSelfChatDialog(true)}
            >
              <FiMessageSquare />
            </motion.button>
          </motion.div>
        )}

        {isAuthenticated && searchResults.map(user => {
          const unreadCount = getConversationUnreadCount(user.userId);
          
          return (
            <motion.div 
              key={user.userId}
              className="user-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="user-avatar-container">
                <div className="user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.username.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div className="user-status-indicator"></div>
                </div>
                {unreadCount > 0 && (
                  <div className="unread-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
              
              <div className="user-info">
                <h3>{user.username}</h3>
                <p>{user.email}</p>
              </div>
              
              {user.userId !== currentUser?.id && (
                <motion.button 
                  className="add-chat-button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleStartChat(user.userId, user.username, user.avatar)}
                >
                  <FiMessageSquare />
                </motion.button>
              )}
            </motion.div>
          );
        })}

        {isAuthenticated && searchResults.length === 0 && (
          <div className="no-users-message">
            {searchTerm ? "No matching users found" : "No online users at the moment"}
          </div>
        )}

        <AnimatePresence>
          {showSelfChatDialog && (
            <motion.div 
              className="self-chat-dialog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSelfChatDialog(false)}
            >
              <motion.div 
                className="dialog-content"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Chat with Yourself</h3>
                <p>You can send messages, notes, and links to yourself</p>
                <div className="dialog-actions">
                  <button 
                    className="cancel-button"
                    onClick={() => setShowSelfChatDialog(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="confirm-button"
                    onClick={handleSelfChat}
                  >
                    Start Chat
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnlineUsers;
