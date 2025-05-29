import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import socketService from "../services/SocketService";

interface User {
  id: string;
  userId: string;
  username: string;
  email: string;
  avatar: string;
}

interface AuthError {
  message: string;
  field?: "email" | "username" | "password";
  action?: "signin" | "register";
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  socketConnected: boolean;
  authError: AuthError | null;
  clearError: () => void;
  checkEmailAvailability: (email: string) => Promise<boolean>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const socketConnectionAttempt = useRef<Promise<void> | null>(null);

  const clearError = useCallback(() => setAuthError(null), []);

  // Real-time validation checks
  const checkEmailAvailability = useCallback(async (email: string) => {
    try {
      const response = await fetch(
        `/api/auth/check-email/${encodeURIComponent(email)}`
      );
      if (!response.ok) throw new Error("Email check failed");
      const data = await response.json();
      return !data.exists;
    } catch (error) {
      console.error("Email availability check failed:", error);
      return false;
    }
  }, []);

  const checkUsernameAvailability = useCallback(async (username: string) => {
    try {
      const response = await fetch(
        `/api/auth/check-username/${encodeURIComponent(username)}`
      );
      if (!response.ok) throw new Error("Username check failed");
      const data = await response.json();
      return !data.exists;
    } catch (error) {
      console.error("Username availability check failed:", error);
      return false;
    }
  }, []);

  // Socket connection management

  const initializeSocketConnection = useCallback(async (user: User) => {
    if (!user?.id) return;

    // Get JWT token from storage
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Cannot initialize socket - missing authentication token");
      return;
    }

    // Prevent duplicate connection attempts
    if (socketConnectionAttempt.current) {
      return socketConnectionAttempt.current;
    }

    socketConnectionAttempt.current = (async () => {
      try {
        // Connect with JWT token instead of user ID
        await socketService.connect(token);
        setSocketConnected(true);

        // Removed manual user_connected emit - handled by server middleware
      } catch (error) {
        console.error("Socket connection failed:", error);
        setSocketConnected(false);
      } finally {
        socketConnectionAttempt.current = null;
      }
    })();

    return socketConnectionAttempt.current;
  }, []);

  // Login handler
  const login = useCallback(
    async (email: string, password: string) => {
      clearError();
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase(), password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw {
            message: data.error || "Login failed",
            field: data.field,
            action: data.action,
          };
        }

        const { token, user: userData } = data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));

        setCurrentUser(userData);
        setIsAuthenticated(true);
        await initializeSocketConnection(userData);
      } catch (error: any) {
        setAuthError({
          message: error.message,
          field: error.field,
          action: error.action,
        });
        throw error;
      }
    },
    [clearError, initializeSocketConnection]
  );

  // Registration handler
  const register = useCallback(
    async (username: string, email: string, password: string) => {
      clearError();
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw {
            message: data.error || "Registration failed",
            field: data.field,
            action: data.action,
          };
        }

        const { token, user: userData } = data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));

        setCurrentUser(userData);
        setIsAuthenticated(true);
        await initializeSocketConnection(userData);
      } catch (error: any) {
        setAuthError({
          message: error.message,
          field: error.field,
          action: error.action,
        });
        throw error;
      }
    },
    [clearError, initializeSocketConnection]
  );

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setIsAuthenticated(false);
    setSocketConnected(false);
    socketService.disconnect();
  }, []);

  // Session persistence
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        try {
          const decoded: { exp: number } = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");

          const user = JSON.parse(userData);
          if (!user.id) throw new Error("Invalid user data");

          setCurrentUser(user);
          setIsAuthenticated(true);
          await initializeSocketConnection(user);
        } catch (error) {
          logout();
        }
      }
    };

    validateSession();
  }, [initializeSocketConnection, logout]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        socketConnected,
        authError,
        clearError,
        checkEmailAvailability,
        checkUsernameAvailability,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};