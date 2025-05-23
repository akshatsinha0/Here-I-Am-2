import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import socketService from '../services/SocketService';

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  socketConnected: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketConnectionAttempt = useRef<Promise<void> | null>(null);

  // Socket connection with retry and state tracking
  const initializeSocketConnection = useCallback(async (user: User) => {
    if (!user?.id) {
      console.error('Cannot initialize socket - missing user ID');
      return;
    }
    
    // Prevent multiple connection attempts
    if (socketConnectionAttempt.current) {
      return socketConnectionAttempt.current;
    }
    
    // Get token from storage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Cannot initialize socket - missing authentication token');
      return;
    }
    
    // Set up socket connection
    socketConnectionAttempt.current = (async () => {
      try {
        // Connect with auth credentials
        await socketService.connect({
          userId: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar || '/default-avatar.png'
        });
        
        setSocketConnected(true);
        
        // Only emit after successful connection
        if (socketService.connected) {
          await socketService.emit('user_connected', {
            userId: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar
          }).catch(error => {
            console.error('Failed to emit user_connected event:', error);
          });
        }
      } catch (error) {
        console.error('Socket connection failed:', error);
        setSocketConnected(false);
        // Clear the connection attempt to allow retrying
        socketConnectionAttempt.current = null;
      }
    })();
    
    return socketConnectionAttempt.current;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Step 1: Send login credentials
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // Handle non-JSON responses
      const loginText = await loginResponse.text();
      if (!loginText) throw new Error('Empty server response');
      
      let loginData;
      try {
        loginData = JSON.parse(loginText);
      } catch (e) {
        throw new Error(`Invalid response format: ${loginText}`);
      }
      
      if (!loginResponse.ok) {
        throw new Error(loginData.message || 'Login failed');
      }

      const { token, userId } = loginData;
      
      // Step 2: Fetch user profile with token
      const userResponse = await fetch(`/api/users/${userId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userResponse.json();
      
      // Verify we have the essential user data
      if (!userData.id) {
        userData.id = userId; // Ensure ID is present
      }
      
      // Step 3: Store user data and authenticate
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setCurrentUser(userData);
      setIsAuthenticated(true);
      
      // Step 4: Initialize socket connection
      await initializeSocketConnection(userData);
    } catch (error) {
      console.error('Login error:', error);
      logout(); // Clean up any partial state
      throw error;
    }
  }, [initializeSocketConnection]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    try {
      // Step 1: Register new user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      // Handle potential non-JSON responses
      const responseText = await response.text();
      if (!responseText) throw new Error('Empty server response');
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid response format: ${responseText}`);
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Step 2: Log in with the registered credentials
      await login(email, password); // Use the same credentials
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, [login]);

  const logout = useCallback(() => {
    try {
      // Step 1: Notify server of logout if connected
      if (currentUser?.id && socketService.connected) {
        socketService.emit('user_disconnected', { userId: currentUser.id })
          .catch(error => console.error('Error during disconnect notification:', error));
      }
      
      // Step 2: Close socket connection
      socketService.disconnect();
      setSocketConnected(false);
      socketConnectionAttempt.current = null;
      
      // Step 3: Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      
      // Step 4: Update state
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
      // Force state reset regardless of errors
      setCurrentUser(null);
      setIsAuthenticated(false);
      setSocketConnected(false);
    }
  }, [currentUser]);

  // Session validation on mount
  useEffect(() => {
    const validateSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        const userId = localStorage.getItem('userId');

        if (token && userData && userId) {
          // Step 1: Validate token expiration
          const decoded: { exp: number } = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            throw new Error('Token expired');
          }
          
          // Step 2: Parse and validate user data
          const user = JSON.parse(userData);
          if (!user.id) {
            user.id = userId; // Ensure ID is present
          }
          
          // Step 3: Set authentication state
          setCurrentUser(user);
          setIsAuthenticated(true);
          
          // Step 4: Initialize socket connection
          await initializeSocketConnection(user);
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        logout();
      }
    };

    validateSession();
  }, [initializeSocketConnection, logout]);

  // Socket reconnection handler
  useEffect(() => {
    const handleReconnect = () => {
      if (currentUser && isAuthenticated && !socketConnected) {
        console.log('Attempting socket reconnection...');
        initializeSocketConnection(currentUser);
      }
    };

    // Check connection every 30 seconds if authenticated but socket disconnected
    let reconnectInterval: NodeJS.Timeout | null = null;
    if (isAuthenticated && currentUser && !socketConnected) {
      reconnectInterval = setInterval(handleReconnect, 30000);
    }

    return () => {
      if (reconnectInterval) clearInterval(reconnectInterval);
    };
  }, [currentUser, isAuthenticated, socketConnected, initializeSocketConnection]);

  return (
    <AuthContext.Provider value={{ 
      currentUser,
      isAuthenticated,
      socketConnected,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
