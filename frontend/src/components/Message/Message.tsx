import { useState } from "react";
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
  };
  isOwnMessage: boolean;
  showAvatar: boolean;
  onReply?: () => void;
}

const Message = ({
  message,
  isOwnMessage,
  showAvatar,
  onReply,
}: MessageProps) => {
  const [showOptions, setShowOptions] = useState(false);

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

  return (
    <div className={`message-row ${isOwnMessage ? "own-message" : ""}`}>
      <motion.div
        className={`message ${isOwnMessage ? "sent" : "received"}`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        onHoverStart={() => setShowOptions(true)}
        onHoverEnd={() => setShowOptions(false)}
      >
        <div className="message-content-container">
          <div className="message-content">
            {(() => {
              if (typeof message.text === "string") {
                return message.text;
              }
              // Handle object case - extract the inner text
              if (typeof message.text === "object" && message.text !== null) {
                if ("text" in message.text) {
                  return message.text.text;
                }
              }
              // Fallback to stringification
              return JSON.stringify(message.text);
            })()}

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
