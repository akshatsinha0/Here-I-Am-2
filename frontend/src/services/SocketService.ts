import { io, Socket } from 'socket.io-client';

// Event type definitions
interface ServerToClientEvents {
  online_users: (users: any[]) => void;
  new_message: (data: any) => void;
  new_conversation: (data: any) => void;
  conversation_updated: (data: any) => void;
  disconnect: (reason: string) => void;
}

interface ClientToServerEvents {
  user_connected: (callback: (response: any) => void) => void;
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
  private connectionTimeout = 10000;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  async connect(token: string): Promise<CustomSocket> {
    if (this.connectionPromise && this.socket?.connected) {
      return this.connectionPromise;
    }

    this.reconnectAttempts = 0;
    
    this.connectionPromise = new Promise((resolve, reject) => {
      this.socket = io('http://localhost:3001', {
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: this.connectionTimeout,
        transports: ['polling', 'websocket'],
        withCredentials: true,
        extraHeaders: {
          Authorization: `Bearer ${token}`
        }
      }) as CustomSocket;

      const connectHandler = () => {
        console.log('Socket connected successfully');
        resolve(this.socket!);
      };

      const errorHandler = (error: Error) => {
        console.error('Socket connection error:', error);
        this.handleReconnection(error, reject);
      };

      this.socket.once('connect', connectHandler);
      this.socket.once('connect_error', errorHandler);

      const timeout = setTimeout(() => {
        if (!this.socket?.connected) {
          reject(new Error('Connection timeout'));
          this.cleanup();
        }
      }, this.connectionTimeout);

      this.socket.on('connect', () => clearTimeout(timeout));
    });

    this.setupEventHandlers();
    return this.connectionPromise;
  }

  private handleReconnection(error: Error, reject: (reason?: any) => void) {
    this.reconnectAttempts++;
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      reject(new Error(`Connection failed after ${this.maxReconnectAttempts} attempts`));
      this.cleanup();
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        setTimeout(() => this.socket?.connect(), 3000);
      }
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnect attempt ${attempt}/${this.maxReconnectAttempts}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      this.cleanup();
    });
  }

  private cleanup() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
  }

  disconnect() {
    this.cleanup();
  }

  emit<T = any, R = any>(event: string, data?: T): Promise<R> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Emit timeout for ${event}`));
      }, 5000);

      this.socket.emit(event, data, (response: R) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  on<T = any>(event: string, callback: (data: T) => void) {
    this.socket?.on(event, callback);
  }

  off<T = any>(event: string, callback?: (data: T) => void) {
    this.socket?.off(event, callback);
  }

  get id() {
    return this.socket?.id;
  }

  get connected() {
    return !!this.socket?.connected;
  }
}

export default SocketService.getInstance();
