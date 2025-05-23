import { io, Socket } from 'socket.io-client';

// User data interface
interface UserData {
  userId: string;
  username: string;
  email: string;
  avatar: string;
}

// Socket event interfaces
interface ServerToClientEvents {
  online_users: (users: any[]) => void;
  new_message: (data: any) => void;
  new_conversation: (data: any) => void;
  conversation_updated: (data: any) => void;
  disconnect: (reason: string) => void;
}

interface ClientToServerEvents {
  user_connected: (userData: UserData, callback: (response: any) => void) => void;
  user_disconnected: (data: { userId: string }) => void;
  get_online_users: (callback?: (response: any) => void) => void;
  send_message: (data: any, callback: (response: any) => void) => void;
  start_conversation: (data: any, callback: (response: any) => void) => void;
}

type CustomSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: CustomSocket | null = null;
  private static instance: SocketService;
  private connectionPromise: Promise<CustomSocket> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionTimeout = 10000; // 10 seconds

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Connect to socket server with user data
   */
  async connect(options: UserData | string): Promise<CustomSocket> {
    // If we're already connecting, return the existing promise
    if (this.connectionPromise && this.socket) {
      return this.connectionPromise;
    }

    // Reset connection state
    this.reconnectAttempts = 0;
    
    // Create new connection promise
    this.connectionPromise = new Promise<CustomSocket>((resolve, reject) => {
      const serverUrl = 'http://localhost:3001';
      let userData: UserData;
      
      // Handle different parameter types
      if (typeof options === 'string') {
        // If passed a string, assume it's a user ID
        userData = {
          userId: options,
          username: 'Unknown',
          email: 'unknown@example.com',
          avatar: '/default-avatar.png'
        };
      } else {
        // Otherwise use the provided user data
        userData = options;
      }
      
      // Ensure we have a valid user ID
      if (!userData.userId) {
        reject(new Error('Invalid user ID provided'));
        this.connectionPromise = null;
        return;
      }

      console.log(`Connecting socket with user ID: ${userData.userId}`);
      
      // Initialize socket connection
      this.socket = io(serverUrl, {
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: this.connectionTimeout,
        query: { userId: userData.userId }
      }) as CustomSocket;

      // Set up connection handlers
      const connectHandler = () => {
        console.log('Socket connected successfully');
        
        // Emit user_connected event with user data
        this.socket!.emit('user_connected', userData, (response) => {
          if (response?.status === 'connected') {
            console.log('User connected to socket server:', response);
            resolve(this.socket!);
          } else {
            const error = new Error(`Connection rejected: ${response?.message || 'Unknown error'}`);
            console.error(error);
            reject(error);
            this.cleanup();
          }
        });
      };

      // Set up error handlers
      const errorHandler = (error: Error) => {
        console.error('Socket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
          reject(new Error(`Connection failed after ${this.maxReconnectAttempts} attempts`));
          this.cleanup();
        }
      };

      // Attach event listeners
      this.socket.once('connect', connectHandler);
      this.socket.on('connect_error', errorHandler);

      // Set connection timeout
      const timeout = setTimeout(() => {
        if (!this.socket?.connected) {
          reject(new Error('Connection timeout'));
          this.cleanup();
        }
      }, this.connectionTimeout);

      // Clean up timeout on success
      this.socket.on('connect', () => clearTimeout(timeout));
    });

    // Set up disconnect and reconnection handlers
    this.setupEventHandlers();
    return this.connectionPromise;
  }

  /**
   * Setup common socket event handlers
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us intentionally
        console.log('Server disconnected socket. Reconnecting in 3s...');
        setTimeout(() => this.socket?.connect(), 3000);
      }
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed after all attempts');
      this.connectionPromise = null;
    });
  }

  /**
   * Clean up socket connection and state
   */
  private cleanup() {
    if (this.socket) {
      console.log('Cleaning up socket connection');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    this.cleanup();
  }

  /**
   * Emit event with promise-based acknowledgment
   */
  emit<T = any, R = any>(event: string, data?: T): Promise<R> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket instance not initialized'));
        return;
      }

      if (!this.socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Set timeout for acknowledgment
      const timeout = setTimeout(() => {
        reject(new Error(`Emit timeout for event "${event}"`));
      }, 5000);

      // Emit with acknowledgment
      this.socket.emit(event, data, (response: R) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  /**
   * Register event listener
   */
  on<T = any>(event: string, callback: (data: T) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.warn(`Attempted to register listener for "${event}" but socket is not initialized`);
    }
  }

  /**
   * Remove event listener
   */
  off<T = any>(event: string, callback?: (data: T) => void): void {
    this.socket?.off(event, callback);
  }

  /**
   * Get socket ID
   */
  get id(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Check if socket is connected
   */
  get connected(): boolean {
    return !!this.socket?.connected;
  }
}

export default SocketService.getInstance();
