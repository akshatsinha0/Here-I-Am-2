import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import './AuthWarningModal.css';

interface AuthWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const AuthWarningModal = ({ isOpen, onClose, onLogin }: AuthWarningModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="auth-warning-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <FiAlertCircle className="warning-icon" />
              <button className="close-btn" onClick={onClose}>
                <FiX />
              </button>
            </div>

            <div className="modal-content">
              <h2>Authentication Required</h2>
              <p>First please log in to avail these features</p>
            </div>

            <div className="modal-actions">
              <button onClick={onClose} className="btn-cancel">
                Cancel
              </button>
              <button onClick={onLogin} className="btn-login">
                Sign In
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthWarningModal;
