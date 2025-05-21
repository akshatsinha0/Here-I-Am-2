import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEdit, FiMoreVertical, FiPlus } from 'react-icons/fi';
import './ChatList.css';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
  online: boolean;
  isGroup: boolean;
}

interface ChatListProps {
  onSelectChat: (id: number) => void;
  selectedChat: number | null;
}

const ChatList = ({ onSelectChat, selectedChat }: ChatListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [showActions, setShowActions] = useState<number | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Simulated data
  useEffect(() => {
    // In a real app, this would be fetched from an API
    const mockChats = [
      {
        id: 1,
        name: 'Sarah Johnson',
        lastMessage: 'Looking forward to our meeting tomorrow!',
        timestamp: '10:42 AM',
        unread: 2,
        avatar: '',
        online: true,
        isGroup: false
      },
      {
        id: 2,
        name: 'Development Team',
        lastMessage: 'Alex: I just pushed the latest changes',
        timestamp: 'Yesterday',
        unread: 0,
        avatar: '',
        online: false,
        isGroup: true
      },
      {
        id: 3,
        name: 'Michael Chen',
        lastMessage: 'Thanks for the update',
        timestamp: 'Yesterday',
        unread: 0,
        avatar: '',
        online: true,
        isGroup: false
      },
      {
        id: 4,
        name: 'Project X Discussion',
        lastMessage: 'Let\'s finalize the design by Friday',
        timestamp: 'Monday',
        unread: 5,
        avatar: '',
        online: false,
        isGroup: true
      },
      {
        id: 5,
        name: 'Emma Wilson',
        lastMessage: 'Can we reschedule our call?',
        timestamp: '05/18',
        unread: 0,
        avatar: '',
        online: false,
        isGroup: false
      }
    ];
    
    setChats(mockChats);
  }, []);

  const filteredChats = chats.filter(
    chat => chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <AnimatePresence>
          {filteredChats.map(chat => (
            <motion.div 
              key={chat.id}
              className={`chat-item ${selectedChat === chat.id ? 'selected' : ''}`}
              onClick={() => onSelectChat(chat.id)}
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
                {chat.online && <div className="online-indicator"></div>}
              </div>
              <div className="chat-details">
                <div className="chat-header">
                  <h3 className="chat-name">{chat.name}</h3>
                  <span className="chat-time">{chat.timestamp}</span>
                </div>
                <div className="chat-message-preview">
                  <p>{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="unread-badge">{chat.unread}</span>
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
                  >
                    <button>Mark as read</button>
                    <button>Pin conversation</button>
                    <button className="delete-action">Delete</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
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
