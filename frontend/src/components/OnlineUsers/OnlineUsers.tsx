import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiUserPlus } from 'react-icons/fi';
import './OnlineUsers.css';

interface User {
  id: number;
  name: string;
  status: string;
  avatar: string;
  lastSeen: string;
}

interface OnlineUsersProps {
  onSelectUser: (userId: number) => void;
}

const OnlineUsers = ({ onSelectUser }: OnlineUsersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Simulated data
  useEffect(() => {
    // In a real app, this would be fetched from an API
    const mockUsers = [
      {
        id: 1,
        name: 'Sarah Johnson',
        status: 'online',
        avatar: '',
        lastSeen: 'Active now'
      },
      {
        id: 2,
        name: 'Michael Chen',
        status: 'online',
        avatar: '',
        lastSeen: 'Active now'
      },
      {
        id: 3,
        name: 'Emma Wilson',
        status: 'offline',
        avatar: '',
        lastSeen: '2 hours ago'
      },
      {
        id: 4,
        name: 'David Rodriguez',
        status: 'online',
        avatar: '',
        lastSeen: 'Active now'
      },
      {
        id: 5,
        name: 'Sophia Lee',
        status: 'online',
        avatar: '',
        lastSeen: 'Active now'
      },
      {
        id: 6,
        name: 'James Taylor',
        status: 'offline',
        avatar: '',
        lastSeen: '30 minutes ago'
      },
      {
        id: 7,
        name: 'Olivia Brown',
        status: 'offline',
        avatar: '',
        lastSeen: '1 day ago'
      }
    ];
    
    setUsers(mockUsers);
  }, []);
  
  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort online users first
    filtered.sort((a, b) => {
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      return 0;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm]);
  
  return (
    <div className="online-users">
      <div className="online-users-header">
        <h2>Online Contacts</h2>
      </div>
      
      <div className="user-search-container">
        <FiSearch className="user-search-icon" />
        <input 
          type="text" 
          placeholder="Search contacts..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="user-search-input"
        />
      </div>
      
      <div className="users-list">
        {filteredUsers.map(user => (
          <motion.div 
            key={user.id}
            className="user-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
            onClick={() => onSelectUser(user.id)}
          >
            <div className="user-avatar-container">
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                {user.status === 'online' && <div className="user-status-indicator"></div>}
              </div>
            </div>
            
            <div className="user-info">
              <h3>{user.name}</h3>
              <p>{user.status === 'online' ? 'Active now' : user.lastSeen}</p>
            </div>
            
            <motion.button 
              className="add-chat-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectUser(user.id);
              }}
            >
              <FiUserPlus />
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OnlineUsers;
