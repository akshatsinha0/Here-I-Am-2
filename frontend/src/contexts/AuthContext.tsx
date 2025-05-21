// src/contexts/AuthContext.tsx
import { createContext, useState, useContext, ReactNode } from 'react';
import defaultAvatar from '../assets/defaultAvatar.png'; // Import the default avatar

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string; // Add avatar property
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Check if user data exists in localStorage
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('user') !== null;
  });

  const login = async (username: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Create mock user with default avatar
    const mockUser = {
      id: Math.random().toString(36).substring(2, 9),
      username,
      email: `${username.toLowerCase()}@example.com`,
      avatar: defaultAvatar // Set default avatar path
    };
    
    // Store in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    setCurrentUser(mockUser);
    setIsAuthenticated(true);
  };

  const register = async (username: string, email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Create mock user with default avatar
    const mockUser = {
      id: Math.random().toString(36).substring(2, 9),
      username,
      email,
      avatar: defaultAvatar // Set default avatar path
    };
    
    // Store in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    setCurrentUser(mockUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
