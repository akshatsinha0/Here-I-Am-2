// src/components/Navigation/Navigation.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiX, FiMessageSquare, FiUsers, FiSettings, FiMoon, FiSun, FiLogOut } from 'react-icons/fi';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../UserAvatar/UserAvatar';
import './Navigation.css';

interface NavigationProps {
  showSidebar: boolean;
  toggleSidebar: () => void;
  onLogin: () => void;
}

const Navigation = ({ showSidebar, toggleSidebar, onLogin }: NavigationProps) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('chats');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleUserClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu);
    } else {
      onLogin();
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-header">
        <motion.button 
          className="nav-toggle"
          onClick={toggleSidebar}
          whileTap={{ scale: 0.95 }}
        >
          {showSidebar ? <FiX /> : <FiMenu />}
        </motion.button>
        <motion.div 
          className="logo"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          HereIAm2
        </motion.div>
      </div>

      <div className="nav-tabs">
        <motion.button 
          className={`nav-tab ${activeTab === 'chats' ? 'active' : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('chats')}
        >
          <FiMessageSquare />
          <span className="tab-label">Chats</span>
        </motion.button>

        <motion.button 
          className={`nav-tab ${activeTab === 'people' ? 'active' : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('people')}
        >
          <FiUsers />
          <span className="tab-label">People</span>
        </motion.button>

        <motion.button 
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('settings')}
        >
          <FiSettings />
          <span className="tab-label">Settings</span>
        </motion.button>
      </div>

      <div className="nav-footer">
        <motion.button 
          className="theme-toggle"
          onClick={toggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </motion.button>
        
        <div className="user-profile" onClick={handleUserClick}>
          {isAuthenticated && currentUser ? (
            <UserAvatar 
              src={currentUser.avatar}
              username={currentUser.username}
            />
          ) : (
            <div className="login-button">Sign In</div>
          )}
          
          {showUserMenu && isAuthenticated && (
            <motion.div 
              className="user-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="user-menu-header">
                <UserAvatar 
                  src={currentUser!.avatar}
                  username={currentUser!.username}
                  size="lg"
                />
                <div className="user-info">
                  <h4>{currentUser!.username}</h4>
                  <p>{currentUser!.email}</p>
                </div>
              </div>
              <div className="user-menu-items">
                <button className="user-menu-item">
                  <FiSettings />
                  <span>Profile Settings</span>
                </button>
                <button className="user-menu-item logout" onClick={logout}>
                  <FiLogOut />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
