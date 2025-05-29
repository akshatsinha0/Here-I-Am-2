import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiMoreVertical, FiPaperclip, FiSmile, FiSend, FiMic, FiChevronDown, FiX } from 'react-icons/fi';
import { useConversations } from '../../contexts/ConversationsContext';
import { useOnlineUsers } from '../../contexts/OnlineUsersContext';
import { useAuth } from '../../contexts/AuthContext';
import Message from '../Message/Message';
import './ChatArea.css';
import { isValidObjectId } from '../../utils/validation';

interface MessageType {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  unread?: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderId: string;
  };
}

const ChatArea = ({ onBack }: { onBack: () => void }) => {
  const { currentUser } = useAuth();
  const { 
    activeConversation, 
    messages, 
    sendMessage, 
    conversations, 
    loadMessages,
    setActiveConversation,
    markMessagesAsRead
  } = useConversations();
  const { isUserOnline } = useOnlineUsers();
  
  const [newMessage, setNewMessage] = useState('');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const activeChat = useMemo(() => 
    activeConversation ? conversations.find(c => c.id === activeConversation) : null,
    [activeConversation, conversations]
  );

  const activeMessages = useMemo(
    () => (activeConversation ? messages[activeConversation] || [] : []),
    [activeConversation, messages]
  );

  // Load messages and mark as read when conversation changes
  useEffect(() => {
    const loadAndMarkRead = async () => {
      if (!activeConversation || !currentUser?.id) return;
      
      try {
        if (!isValidObjectId(activeConversation)) {
          throw new Error('Invalid conversation ID');
      }
      
        await loadMessages(activeConversation);
        const messageIds = activeMessages.map(m => m.id);
        if (messageIds.length > 0) {
          await markMessagesAsRead(activeConversation, messageIds);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setConnectionError(true);
        setTimeout(() => setConnectionError(false), 3000);
      }
    };

    loadAndMarkRead();
  }, [activeConversation, currentUser?.id]);

  // Scroll handling with debouncing
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollToBottom(!isAtBottom);
    setIsScrolling(true);

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 200);
  }, []);

  // Scroll listener setup
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Auto-scroll to bottom when not manually scrolling
  useEffect(() => {
    if (!isScrolling) {
      scrollToBottom();
    }
  }, [activeMessages, isScrolling]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Enhanced send message with persistence
  const handleSendMessage = useCallback(async () => {
    if (!activeConversation || !newMessage.trim() || !currentUser?.id) return;
    
    try {
      const tempId = Date.now().toString();
      const newMessageObj = {
        id: tempId,
        text: newMessage,
        senderId: currentUser.id,
        timestamp: new Date().toISOString(),
        status: 'sent' as const,
        unread: true
      };

      await sendMessage(activeConversation, newMessageObj);
      setNewMessage('');
      setReplyingTo(null);

      if (!isScrolling) {
        setTimeout(() => scrollToBottom('auto'), 50);
      }
    } catch (error) {
      console.error('Message send error:', error);
      setConnectionError(true);
      setTimeout(() => setConnectionError(false), 3000);
    }
  }, [activeConversation, newMessage, currentUser?.id, isScrolling]);

  const getChatName = useCallback(() => {
    return activeChat?.isGroup ? activeChat.name : activeChat?.participantsName || '';
  }, [activeChat]);

  const getOnlineStatus = useCallback(() => {
    if (!activeChat || activeChat.isGroup) return false;
    const otherParticipant = activeChat.participants.find(id => id !== currentUser?.id);
    return otherParticipant ? isUserOnline(otherParticipant) : false;
  }, [activeChat, currentUser?.id, isUserOnline]);

  // Mark messages as read when visible
  const handleMessageVisible = useCallback((messageId: string) => {
    if (activeConversation && currentUser?.id) {
      markMessagesAsRead(activeConversation, [messageId]);
    }
  }, [activeConversation, currentUser?.id, markMessagesAsRead]);

  if (!activeConversation || !activeChat) {
    return (
      <div className="empty-chat-area">
        <div className="no-chat-selected">
          <h2>Select a conversation or start a new one</h2>
          <p>Choose from your existing conversations or find someone online to chat with</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="header-left">
          <motion.button 
            className="back-button"
            onClick={onBack}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiArrowLeft />
          </motion.button>
          <div className="chat-info">
            <h2>{getChatName()}</h2>
            <p className="chat-status">
              {activeChat.isSelfChat ? 'Notes to self' : 
                (activeChat.isGroup ? `${activeChat.participants.length} participants` : 
                  (getOnlineStatus() ? 'Online' : 'Offline'))}
            </p>
          </div>
        </div>
        <div className="header-right">
          <motion.button 
            className="header-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiMoreVertical />
          </motion.button>
        </div>
      </div>

      {connectionError && (
        <div className="connection-error-banner">
          Connection lost - attempting to reconnect...
        </div>
      )}

      <div className="messages-container" ref={messagesContainerRef}>
        <div className="messages-wrapper">
          {activeChat.isSelfChat && activeMessages.length === 0 && (
            <div className="self-chat-welcome">
              <div className="welcome-message">
                <h3>Welcome to your personal space</h3>
                <p>Use this chat to send yourself reminders, notes, links, or any information you want to keep handy.</p>
              </div>
            </div>
          )}
          
          {activeMessages.map((message, index) => {
            const isOwnMessage = currentUser?.id === message.senderId;
            const showAvatar = index === 0 || activeMessages[index - 1].senderId !== message.senderId;
            
            return (
              <Message 
                key={message.id}
                message={message}
                isOwnMessage={isOwnMessage}
                showAvatar={showAvatar}
                onReply={() => setReplyingTo(message)}
                onMarkAsRead={() => handleMessageVisible(message.id)}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        <AnimatePresence>
          {showScrollToBottom && (
            <motion.button 
              className="scroll-to-bottom"
              onClick={() => scrollToBottom()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiChevronDown />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {replyingTo && (
          <motion.div 
            className="reply-container"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="reply-content">
              <div className="reply-bar"></div>
              <div className="reply-text">
                <span className="reply-sender">
                  {replyingTo.senderId === currentUser?.id ? 'You' : getChatName()}
                </span>
                <p>{replyingTo.text}</p>
              </div>
              <button 
                className="close-reply"
                onClick={() => setReplyingTo(null)}
              >
                <FiX />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="chat-input-area">
        <div className="input-actions-left">
          <motion.button 
            className="input-action-button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiPaperclip />
          </motion.button>
          <motion.button 
            className="input-action-button"
            onClick={() => setShowEmoji(!showEmoji)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiSmile />
          </motion.button>
        </div>

        <div className="message-input-container">
          <input 
            type="text" 
            placeholder={activeChat?.isSelfChat ? "Write a note to yourself..." : "Type a message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="message-input"
            disabled={connectionError}
          />
        </div>

        <div className="input-actions-right">
          {newMessage.trim() === '' ? (
            <motion.button 
              className="input-action-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={connectionError}
            >
              <FiMic />
            </motion.button>
          ) : (
            <motion.button 
              className="send-button"
              onClick={handleSendMessage}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={connectionError}
            >
              <FiSend />
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAttachMenu && (
          <motion.div 
            className="attach-menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <button className="attach-option photo">
              <span className="attachment-icon">📷</span>
              <span>Photo</span>
            </button>
            <button className="attach-option document">
              <span className="attachment-icon">📄</span>
              <span>Document</span>
            </button>
            <button className="attach-option location">
              <span className="attachment-icon">📍</span>
              <span>Location</span>
            </button>
            <button className="attach-option poll">
              <span className="attachment-icon">📊</span>
              <span>Poll</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmoji && (
          <motion.div 
            className="emoji-picker"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="emoji-categories">
              <button className="emoji-category active">😀</button>
              <button className="emoji-category">🐶</button>
              <button className="emoji-category">🍎</button>
              <button className="emoji-category">⚽</button>
              <button className="emoji-category">🌍</button>
              <button className="emoji-category">💡</button>
              <button className="emoji-category">🚗</button>
              <button className="emoji-category">❤️</button>
            </div>
            <div className="emoji-grid">
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😀')}>😀</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😃')}>😃</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😄')}>😄</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😁')}>😁</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😆')}>😆</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😅')}>😅</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😂')}>😂</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '🤣')}>🤣</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😊')}>😊</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😇')}>😇</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '🙂')}>🙂</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '🙃')}>🙃</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😉')}>😉</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😌')}>😌</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '😍')}>😍</button>
              <button className="emoji-item" onClick={() => setNewMessage(newMessage + '🥰')}>🥰</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatArea;
