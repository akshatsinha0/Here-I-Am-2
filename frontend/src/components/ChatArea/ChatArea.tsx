import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiMoreVertical, FiPaperclip, FiSmile, FiSend, FiMic, FiChevronDown } from 'react-icons/fi';
import Message from '../Message/Message';
import './ChatArea.css';

interface ChatAreaProps {
  chatId: number;
  onBack: () => void;
}

interface MessageType {
  id: number;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: {
    id: number;
    text: string;
    sender: string;
  };
}

const ChatArea = ({ chatId, onBack }: ChatAreaProps) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Simulated data
  useEffect(() => {
    // In a real app, this would be fetched from an API based on chatId
    const mockMessages = [
      {
        id: 1,
        text: 'Hi there! How are you doing today?',
        sender: 'other' as const,
        timestamp: '10:30 AM',
        status: 'read' as const
      },
      {
        id: 2,
        text: "I'm doing well, thanks for asking! Just finishing up some work for the day.",
        sender: 'user' as const,
        timestamp: '10:32 AM',
        status: 'read' as const
      },
      {
        id: 3,
        text: 'Great! Have you had a chance to look at the proposal I sent over yesterday?',
        sender: 'other' as const,
        timestamp: '10:33 AM',
        status: 'read' as const
      },
      {
        id: 4,
        text: 'Yes, I reviewed it this morning. It looks good overall, but I have a few questions about the timeline.',
        sender: 'user' as const,
        timestamp: '10:35 AM',
        status: 'read' as const
      },
      {
        id: 5,
        text: 'Sure, what questions do you have?',
        sender: 'other' as const,
        timestamp: '10:36 AM',
        status: 'read' as const
      },
      {
        id: 6,
        text: 'I was wondering if we could extend the deadline for Phase 2 by an additional week? Our team might need more time for testing.',
        sender: 'user' as const,
        timestamp: '10:38 AM',
        status: 'read' as const,
        replyTo: {
          id: 5,
          text: 'Sure, what questions do you have?',
          sender: 'Sarah Johnson'
        }
      },
      {
        id: 7,
        text: "That shouldn't be a problem. I'll update the timeline and send you a revised version later today.",
        sender: 'other' as const,
        timestamp: '10:40 AM',
        status: 'read' as const
      },
      {
        id: 8,
        text: 'Perfect, thank you! Looking forward to getting started on this project.',
        sender: 'user' as const,
        timestamp: '10:41 AM',
        status: 'delivered' as const
      }
    ];
    
    setMessages(mockMessages);
    
    // Simulate typing indication after a delay
    const typingTimeout = setTimeout(() => {
      setIsTyping(true);
      
      // Clear typing after a few seconds
      setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }, 5000);
    
    return () => clearTimeout(typingTimeout);
  }, [chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll to check if we need to show "scroll to bottom" button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isAtBottom);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const newMsg: MessageType = {
      id: Date.now(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        sender: replyingTo.sender === 'user' ? 'You' : 'Sarah Johnson'
      } : undefined
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    setReplyingTo(null);
  };

  const getChatName = () => {
    // In a real app, you would fetch this based on chatId
    return 'Sarah Johnson';
  };

  const getOnlineStatus = () => {
    // In a real app, you would fetch this based on chatId
    return true;
  };

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
              {getOnlineStatus() ? 'Online' : 'Offline'}
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

      <div className="messages-container" ref={messagesContainerRef}>
        <div className="messages-wrapper">
          {messages.map((message, index) => (
            <Message 
              key={message.id}
              message={message}
              showAvatar={index === 0 || messages[index - 1].sender !== message.sender}
              onReply={() => setReplyingTo(message)}
            />
          ))}
          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Sarah is typing...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <AnimatePresence>
          {showScrollToBottom && (
            <motion.button 
              className="scroll-to-bottom"
              onClick={scrollToBottom}
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
                  {replyingTo.sender === 'user' ? 'You' : getChatName()}
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
            placeholder="Type a message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="message-input"
          />
        </div>

        <div className="input-actions-right">
          {newMessage.trim() === '' ? (
            <motion.button 
              className="input-action-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiMic />
            </motion.button>
          ) : (
            <motion.button 
              className="send-button"
              onClick={handleSendMessage}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
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
              {/* This would be populated with actual emojis in a real implementation */}
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

// FiX component for close reply
const FiX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default ChatArea;
