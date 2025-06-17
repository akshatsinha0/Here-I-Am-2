
import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import socketService from '../services/SocketService';
import { useAuth } from './AuthContext';

interface OnlineUser {
  userId: string;
  username: string;
  email: string;
  avatar: string;
  socketId: string;
  lastSeen?: string;
}

interface OnlineUsersContextType {
  onlineUsers: OnlineUser[];
  isUserOnline: (userId: string) => boolean;
  searchUsers: (query: string) => OnlineUser[];
  allUsers: OnlineUser[];
  isLoading: boolean;
  error: string | null;
  refreshOnlineUsers: () => Promise<void>;
}

const OnlineUsersContext = createContext<OnlineUsersContextType | undefined>(undefined);

export const useOnlineUsers = () => {
  const context = useContext(OnlineUsersContext);
  if (context === undefined) {
    throw new Error('useOnlineUsers must be used within an OnlineUsersProvider');
  }
  return context;
};

interface OnlineUsersProviderProps {
  children: ReactNode;
}

export const OnlineUsersProvider = ({ children }: OnlineUsersProviderProps) => {
  const [allOnlineUsers, setAllOnlineUsers] = useState<OnlineUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, currentUser, socketConnected } = useAuth();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) {
      setAllOnlineUsers([]);
      setFilteredUsers([]);
      setError(null);
      return;
    }

    if (!socketConnected) {
      setError("Socket disconnected");
      return;
    }

    const handleOnlineUsers = (users: OnlineUser[]) => {
      console.log("Received online users:", users);
      
      if (!Array.isArray(users)) {
        console.error("Invalid online users data:", users);
        setError("Invalid user data received");
        return;
      }

      setIsLoading(false);
      setError(null);
      
      
      setAllOnlineUsers(users);
      
      
      const filtered = users.filter(user => 
        user.userId && currentUser.id && user.userId !== currentUser.id
      );
      setFilteredUsers(filtered);
    };

    
    socketService.on('online_users', handleOnlineUsers);
    
    console.log("Online users listener registered");

    
    return () => {
      socketService.off('online_users', handleOnlineUsers);
    };
  }, [isAuthenticated, currentUser?.id, socketConnected]);

  
  const refreshOnlineUsers = useCallback(async () => {
    if (!isAuthenticated || !currentUser?.id || !socketConnected) {
      return Promise.resolve();
    }

    
    console.log("Online users refresh requested");
    return Promise.resolve();
  }, [isAuthenticated, currentUser?.id, socketConnected]);

  const isUserOnline = useCallback((userId: string): boolean => {
    if (!userId) return false;
    return allOnlineUsers.some(user => 
      user.userId && userId && String(user.userId) === String(userId)
    );
  }, [allOnlineUsers]);

  const searchUsers = useCallback((query: string): OnlineUser[] => {
    if (!query) return filteredUsers;
    
    const lowerQuery = query.toLowerCase();
    
    return allOnlineUsers.filter(user => 
      (user.username && user.username.toLowerCase().includes(lowerQuery)) || 
      (user.email && user.email.toLowerCase().includes(lowerQuery))
    );
  }, [allOnlineUsers, filteredUsers]);

  const value = {
    onlineUsers: filteredUsers,
    allUsers: allOnlineUsers,
    isUserOnline,
    searchUsers,
    isLoading,
    error,
    refreshOnlineUsers
  };

  return <OnlineUsersContext.Provider value={value}>{children}</OnlineUsersContext.Provider>;
};
