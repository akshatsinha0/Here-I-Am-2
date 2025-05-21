import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation/Navigation';
import ChatList from './components/ChatList/ChatList';
import ChatArea from './components/ChatArea/ChatArea';
import OnlineUsers from './components/OnlineUsers/OnlineUsers';
import AuthModal from './components/Auth/AuthModal';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// AppContent separates the component logic from provider wrapping
const AppContent = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setShowSidebar(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-container">
      <Navigation 
        showSidebar={showSidebar} 
        toggleSidebar={() => setShowSidebar(!showSidebar)}
        onLogin={() => {
          setAuthView('signin');
          setShowAuthModal(true);
        }}
      />

      <AnimatePresence mode="wait">
        {showSidebar && (
          <motion.div 
            className="sidebar-container"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isMobile ? '100%' : '320px', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="chat-sidebar">
              <ChatList 
                onSelectChat={(id) => {
                  setSelectedChat(id);
                  if (isMobile) setShowSidebar(false);
                }} 
                selectedChat={selectedChat}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="main-content"
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {selectedChat ? (
          <ChatArea 
            chatId={selectedChat} 
            onBack={() => {
              if (isMobile) setShowSidebar(true);
            }}
          />
        ) : (
          <div className="welcome-screen">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="welcome-content"
            >
              <h1>Welcome to HereIAm2</h1>
              <p>Select a chat to start messaging or discover new connections</p>
              
              {!isAuthenticated && (
                <div className="welcome-actions">
                  <motion.button 
                    className="welcome-button signin"
                    onClick={() => {
                      setAuthView('signin');
                      setShowAuthModal(true);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Sign In
                  </motion.button>
                  <motion.button 
                    className="welcome-button signup"
                    onClick={() => {
                      setAuthView('signup');
                      setShowAuthModal(true);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Create Account
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {(!isMobile || !selectedChat) && (
          <motion.div 
            className="online-users-container"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '280px', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <OnlineUsers onSelectUser={(userId) => {
              // Logic to start a new chat with this user
              console.log(`Starting chat with user ${userId}`);
              // In a real app, you would create a new chat and then:
              // setSelectedChat(newChatId);
              if (isMobile) setShowSidebar(false);
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialView={authView}
      />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
