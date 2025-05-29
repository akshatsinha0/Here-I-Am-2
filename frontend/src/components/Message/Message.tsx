import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FiCheck, FiAlertCircle } from "react-icons/fi";
import "./Message.css";

interface MessageProps {
  message: {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
    status: "sent" | "delivered" | "read" | "failed";
    unread?: boolean;
  };
  isOwnMessage: boolean;
  showAvatar: boolean;
  onReply?: () => void;
  onMarkAsRead?: (messageId: string) => void;
}

const Message = ({
  message,
  isOwnMessage,
  showAvatar,
  onReply,
  onMarkAsRead,
}: MessageProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isUnread, setIsUnread] = useState(message.unread);
  const messageRef = useRef<HTMLDivElement>(null);

  // Sync with parent's unread status updates
  useEffect(() => {
    setIsUnread(message.unread);
  }, [message.unread]);

  // IntersectionObserver for visibility tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          isUnread &&
          !isOwnMessage &&
          onMarkAsRead
        ) {
          setIsUnread(false);
          onMarkAsRead(message.id);
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.75, // 75% visible
      }
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => {
      if (messageRef.current) {
        observer.unobserve(messageRef.current);
      }
    };
  }, [isUnread, message.id, isOwnMessage, onMarkAsRead]);

  const getStatusIcon = () => {
    switch (message.status) {
      case "sent":
        return <FiCheck className="status-icon sent" />;
      case "delivered":
        return (
          <>
            <FiCheck className="status-icon delivered" />
            <FiCheck className="status-icon delivered" />
          </>
        );
      case "read":
        return (
          <>
            <FiCheck className="status-icon read" />
            <FiCheck className="status-icon read" />
          </>
        );
      case "failed":
        return <FiAlertCircle className="status-icon failed" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    let content;
    if (typeof message.text === "string") {
      content = message.text;
    } else if (typeof message.text === "object" && message.text !== null) {
      content = "text" in message.text ? message.text.text : JSON.stringify(message.text);
    } else {
      content = JSON.stringify(message.text);
    }

    return (
      <>
        {isUnread && !isOwnMessage && (
          <div className="unread-indicator" title="New message" />
        )}
        {content}
      </>
    );
  };

  return (
    <div 
      className={`message-row ${isOwnMessage ? "own-message" : ""}`}
      ref={messageRef}
    >
      <motion.div
        className={`message ${isOwnMessage ? "sent" : "received"} ${
          isUnread ? "unread" : ""
        }`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        onHoverStart={() => setShowOptions(true)}
        onHoverEnd={() => setShowOptions(false)}
      >
        <div className="message-content-container">
          <div className="message-content">
            {renderContent()}

            <motion.div
              className="message-actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: showOptions ? 1 : 0 }}
            >
              <button
                className="message-action reply-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply?.();
                }}
              >
                Reply
              </button>
            </motion.div>
          </div>

          <div className="message-meta">
            <span className="message-time">{message.timestamp}</span>
            {isOwnMessage && (
              <span className="message-status">{getStatusIcon()}</span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Message;
