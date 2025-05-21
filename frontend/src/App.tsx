import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation/Navigation';
import ChatList from './components/ChatList/ChatList';
import ChatArea from './components/ChatArea/ChatArea';
import OnlineUsers from './components/OnlineUsers/OnlineUsers';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
import './App.css';

const App = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setShowSidebar(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ThemeProvider>
      <ChatProvider>
        <div className="app-container">
          <Navigation 
            showSidebar={showSidebar} 
            toggleSidebar={() => setShowSidebar(!showSidebar)} 
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
        </div>
      </ChatProvider>
    </ThemeProvider>
  );
};

export default App;
