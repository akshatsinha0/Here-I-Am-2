import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Auth.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'signin' | 'signup';
  prefilledEmail?: string;
}

const AuthModal = ({ isOpen, onClose, initialView = 'signin', prefilledEmail }: AuthModalProps) => {
  const [view, setView] = useState<'signin' | 'signup'>(initialView);
  const [storedEmail, setStoredEmail] = useState(prefilledEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, clearError } = useAuth();

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    clearError();
    try {
      await login(email, password);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    clearError();
    try {
      await register(username, email, password);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleView = (email?: string) => {
    clearError();
    setStoredEmail(email || '');
    setView(prev => prev === 'signin' ? 'signup' : 'signin');
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="auth-backdrop"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          onClick={onClose}
        >
          <motion.div 
            className="auth-modal"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button 
              className="close-button"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiX />
            </motion.button>
            
            <div className="auth-modal-container">
              <div className="auth-branding">
                <div className="logo">HereIAm2</div>
                <h2>Connect instantly, chat effortlessly</h2>
                <p>Join our community of millions already enjoying seamless communication.</p>
                <div className="decorative-circles">
                  <motion.div 
                    className="circle one"
                    animate={{ scale: [1, 1.1, 1], opacity: [1, 0.8, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  />
                  <motion.div 
                    className="circle two"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 4, delay: 1 }}
                  />
                </div>
              </div>
              
              <div className="auth-form-container">
                <AnimatePresence mode="wait">
                  {view === 'signin' ? (
                    <SignInForm 
                      key="signin"
                      onSubmit={handleSignIn} 
                      onToggleForm={(email) => handleToggleView(email)}
                      isLoading={isLoading}
                      prefilledEmail={storedEmail}
                    />
                  ) : (
                    <SignUpForm 
                      key="signup"
                      onSubmit={handleSignUp} 
                      onToggleForm={(email) => handleToggleView(email)}
                      isLoading={isLoading}
                      prefilledEmail={storedEmail}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
