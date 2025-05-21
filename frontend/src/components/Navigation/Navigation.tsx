import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiX, FiMessageSquare, FiUsers, FiSettings, FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../hooks/useTheme';
import './Navigation.css';

interface NavigationProps {
  showSidebar: boolean;
  toggleSidebar: () => void;
}

const Navigation = ({ showSidebar, toggleSidebar }: NavigationProps) => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('chats');

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
        <div className="user-profile">
          <motion.div 
            className="user-avatar"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>JD</span>
          </motion.div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
