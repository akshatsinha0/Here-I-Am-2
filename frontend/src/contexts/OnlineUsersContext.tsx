// src/contexts/OnlineUsersContext.tsx
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

  // Clear any existing retry timers when component unmounts
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Setup online users listener
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) {
      setAllOnlineUsers([]);
      setFilteredUsers([]);
      return;
    }

    const handleOnlineUsers = (users: OnlineUser[]) => {
      if (!Array.isArray(users)) {
        console.error("Received invalid online users data:", users);
        return;
      }

      setIsLoading(false);
      setError(null);
      
      // Store all users
      setAllOnlineUsers(users);
      
      // Filter out current user from the display list
      const filtered = users.filter(user => 
        user.userId && currentUser.id && user.userId !== currentUser.id
      );
      setFilteredUsers(filtered);
    };

    // Register handler
    socketService.on('online_users', handleOnlineUsers);
    
    // Initial request for users
    refreshOnlineUsers();

    // Cleanup
    return () => {
      socketService.off('online_users', handleOnlineUsers);
    };
  }, [isAuthenticated, currentUser?.id, socketConnected]);

  // Function to refresh online users
  const refreshOnlineUsers = useCallback(async () => {
    // Reset any previous retry attempts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Skip if not properly authenticated
    if (!isAuthenticated || !currentUser?.id) {
      return Promise.resolve();
    }
    
    // Skip if socket not connected
    if (!socketService.connected) {
      setError("Cannot fetch online users - socket disconnected");
      
      // Retry after delay
      retryTimeoutRef.current = setTimeout(() => {
        refreshOnlineUsers();
      }, 5000);
      
      return Promise.resolve();
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await socketService.emit('get_online_users');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch online users';
      console.error(errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      
      // Retry after delay
      retryTimeoutRef.current = setTimeout(() => {
        refreshOnlineUsers();
      }, 5000);
    }
    
    return Promise.resolve();
  }, [isAuthenticated, currentUser?.id, socketService.connected]);

  const isUserOnline = useCallback((userId: string): boolean => {
    if (!userId) return false;
    return allOnlineUsers.some(user => 
      user.userId && userId && String(user.userId) === String(userId)
    );
  }, [allOnlineUsers]);

  // Search function with null safety
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
