import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiCheckCircle, FiCornerUpLeft, FiMoreHorizontal } from 'react-icons/fi';
import './Message.css';

interface MessageProps {
  message: {
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
  };
  showAvatar: boolean;
  onReply: () => void;
}

const Message = ({ message, showAvatar, onReply }: MessageProps) => {
  const [showOptions, setShowOptions] = useState(false);
  
  const getStatusIcon = () => {
    switch(message.status) {
      case 'sent':
        return <FiCheck className="status-icon sent" />;
      case 'delivered':
        return (
          <div className="status-double-check">
            <FiCheck className="status-icon delivered" />
            <FiCheck className="status-icon delivered status-second" />
          </div>
        );
      case 'read':
        return <FiCheckCircle className="status-icon read" />;
      default:
        return null;
    }
  };
  
  return (
    <div 
      className={`message-container ${message.sender === 'user' ? 'user' : 'other'}`}
    >
      {message.sender === 'other' && showAvatar && (
        <div className="message-avatar">
          <div className="avatar-placeholder other">SJ</div>
        </div>
      )}
      
      <div className="message-content-wrapper">
        <motion.div 
          className={`message-content ${message.sender === 'user' ? 'user' : 'other'}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          onHoverStart={() => setShowOptions(true)}
          onHoverEnd={() => setShowOptions(false)}
        >
          {message.replyTo && (
            <div className="reply-preview">
              <div className="reply-preview-bar"></div>
              <div className="reply-preview-content">
                <span className="reply-preview-sender">{message.replyTo.sender}</span>
                <p>{message.replyTo.text}</p>
              </div>
            </div>
          )}
          
          <p className="message-text">{message.text}</p>
          
          <div className="message-info">
            <span className="message-time">{message.timestamp}</span>
            {message.sender === 'user' && getStatusIcon()}
          </div>
          
          {showOptions && (
            <motion.div 
              className="message-options"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button 
                className="message-option-button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onReply}
              >
                <FiCornerUpLeft />
              </motion.button>
              <motion.button 
                className="message-option-button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiMoreHorizontal />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
      
      {message.sender === 'user' && showAvatar && (
        <div className="message-avatar user">
          <div className="avatar-placeholder user">JD</div>
        </div>
      )}
    </div>
  );
};

export default Message;
