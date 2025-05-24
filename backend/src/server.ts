import 'dotenv/config';
import express, { Express } from 'express';
import http, { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import cors from 'cors';
import short from 'short-uuid';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import User from './models/User';

// Type definitions
interface UserData {
  userId: string;
  username: string;
  email: string;
  avatar: string;
}

interface MessageData {
  text: string;
  replyTo?: {
    id: string;
    text: string;
    senderId: string;
  };
}

interface Conversation {
  id: string;
  participants: string[];
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isGroup: boolean;
  isSelfChat: boolean;
}

// Initialize Express
const app: Express = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server
const server: HttpServer = http.createServer(app);

// Initialize Socket.IO with authentication
const io: SocketServer = new SocketServer(server, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  },
  cors: {
    origin: "http://localhost:5173",
    allowedHeaders: ["authorization"],
    credentials: true
  }
});

// Enhanced Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const authHeader = socket.handshake.headers.authorization;
    if (!authHeader) throw new Error('Authorization header missing');
    
    const token = authHeader.split(' ')[1];
    if (!token) throw new Error('Authentication token missing');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) throw new Error('User not found');
    
    // Attach user data with proper typing
    socket.data.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar
    };
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

// In-memory stores with type safety
const activeUsers = new Map<string, UserData & { socketId: string; lastSeen: string }>();
const conversations = new Map<string, Conversation>();
const messages = new Map<string, any[]>();
const tempIdMap = new Map<string, string>();

// Helper function to broadcast online users
const broadcastOnlineUsers = () => {
  const usersList = Array.from(activeUsers.values());
  console.log(`Broadcasting ${usersList.length} online users`);
  io.emit('online_users', usersList);
};

// Helper function to find existing conversation
const findExistingConversation = (userId1: string, userId2: string, isSelfChat: boolean = false): string | null => {
  for (const [id, conv] of conversations.entries()) {
    if (isSelfChat && conv.isSelfChat && conv.participants.includes(userId1)) {
      return id;
    }
    if (!isSelfChat && !conv.isSelfChat && !conv.isGroup && 
        conv.participants.includes(userId1) && conv.participants.includes(userId2)) {
      return id;
    }
  }
  return null;
};

// Socket.IO connection handler
io.on('connection', (socket: Socket) => {
  const user = socket.data.user;
  if (!user) return socket.disconnect(true);

  console.log(`New connection: ${user.username} (${user._id})`);

  // Add user to active users with type-safe data
  activeUsers.set(user._id, {
    userId: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar || '/default-avatar.png',
    socketId: socket.id,
    lastSeen: new Date().toISOString()
  });

  // Join user to their personal room
  socket.join(user._id);

  // Broadcast updated online users list to all clients
  broadcastOnlineUsers();

  // Handle explicit request for online users
  socket.on('get_online_users', (callback) => {
    try {
      const usersList = Array.from(activeUsers.values());
      console.log(`Sending ${usersList.length} online users to ${user.username}`);
      if (callback && typeof callback === 'function') {
        callback({ success: true, users: usersList });
      }
    } catch (error) {
      console.error('Error sending online users:', error);
      if (callback && typeof callback === 'function') {
        callback({ success: false, error: 'Failed to fetch online users' });
      }
    }
  });

  // Handle get messages request
  socket.on('get_messages', (conversationId: string, callback) => {
    try {
      const actualConversationId = tempIdMap.get(conversationId) || conversationId;
      const conversationMessages = messages.get(actualConversationId) || [];
      console.log(`Sending ${conversationMessages.length} messages for conversation ${actualConversationId}`);
      
      if (callback && typeof callback === 'function') {
        callback({ success: true, messages: conversationMessages });
      }
    } catch (error) {
      console.error('Error getting messages:', error);
      if (callback && typeof callback === 'function') {
        callback({ success: false, error: 'Failed to get messages' });
      }
    }
  });

  // Handle mark read request
  socket.on('mark_read', (data: { conversationId: string; userId: string }, callback) => {
    try {
      const actualConversationId = tempIdMap.get(data.conversationId) || data.conversationId;
      const conversation = conversations.get(actualConversationId);
      
      if (conversation) {
        conversation.unreadCount = 0;
        console.log(`Marked conversation ${actualConversationId} as read for user ${data.userId}`);
      }
      
      if (callback && typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      if (callback && typeof callback === 'function') {
        callback({ success: false, error: 'Failed to mark as read' });
      }
    }
  });

  // Session reconnection handler
  socket.on('session_reconnect', () => {
    const currentUser = activeUsers.get(user._id);
    if (currentUser) {
      currentUser.socketId = socket.id;
      console.log(`User reconnected: ${user.username}`);
      broadcastOnlineUsers();
    }
  });

  // Enhanced conversation creation handler with duplicate prevention
  socket.on('start_conversation', async (
    data: {
      targetUserId: string;
      targetUsername: string;
      targetAvatar: string;
      tempId?: string;
      isSelfChat?: boolean;
    }, 
    callback
  ) => {
    try {
      const isSelfChat = !!data.isSelfChat;
      const userId = user._id;

      // Check for existing conversation first
      const existingConversationId = findExistingConversation(userId, data.targetUserId, isSelfChat);
      
      if (existingConversationId) {
        console.log(`Found existing conversation: ${existingConversationId}`);
        
        // Join the existing conversation room
        socket.join(existingConversationId);
        
        // Get the existing conversation data
        const existingConversation = conversations.get(existingConversationId);
        
        // Emit the existing conversation to the client
        socket.emit('new_conversation', existingConversation);
        
        if (callback && typeof callback === 'function') {
          callback({ 
            success: true,
            conversationId: existingConversationId,
            tempId: data.tempId,
            existing: true
          });
        }
        return;
      }

      // Validate target user exists for non-self chats
      if (!isSelfChat) {
        const targetUser = await User.findById(data.targetUserId);
        if (!targetUser) throw new Error('Target user not found');
      }

      const translator = short();
      const finalConversationId = isSelfChat ? 
        `self-${userId}-${translator.new()}` : 
        translator.new();

      const newConversation: Conversation = {
        id: finalConversationId,
        participants: isSelfChat ? [userId] : [userId, data.targetUserId],
        name: isSelfChat ? "Yourself" : data.targetUsername,
        avatar: data.targetAvatar,
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0,
        isGroup: false,
        isSelfChat
      };

      // Store conversation
      conversations.set(finalConversationId, newConversation);
      messages.set(finalConversationId, []);

      // Map temporary ID if provided
      if (data.tempId) {
        tempIdMap.set(data.tempId, finalConversationId);
        console.log(`Mapped temp ID ${data.tempId} to ${finalConversationId}`);
      }

      // Join participants to conversation room
      socket.join(finalConversationId);
      if (!isSelfChat) {
        const targetSocket = activeUsers.get(data.targetUserId)?.socketId;
        if (targetSocket) {
          const targetSocketInstance = io.sockets.sockets.get(targetSocket);
          if (targetSocketInstance) {
            targetSocketInstance.join(finalConversationId);
            // Emit new conversation to both participants
            targetSocketInstance.emit('new_conversation', newConversation);
          }
        }
      }

      // Emit new conversation to the creator
      socket.emit('new_conversation', newConversation);

      console.log(`Created new conversation: ${finalConversationId}`);

      if (callback && typeof callback === 'function') {
        callback({ 
          success: true,
          conversationId: finalConversationId,
          tempId: data.tempId,
          existing: false
        });
      }
    } catch (error) {
      console.error('Conversation creation error:', error);
      if (callback && typeof callback === 'function') {
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Message sending handler
  socket.on('send_message', async (
    data: {
      conversationId: string;
      message: MessageData;
    }, 
    callback
  ) => {
    try {
      const actualConversationId = tempIdMap.get(data.conversationId) || data.conversationId;
      const conversation = conversations.get(actualConversationId);

      if (!conversation) {
        console.error(`Conversation not found: ${data.conversationId} -> ${actualConversationId}`);
        console.log('Available conversations:', Array.from(conversations.keys()));
        console.log('Temp ID mappings:', Array.from(tempIdMap.entries()));
        throw new Error('Conversation not found');
      }

      // Create new message with timestamp
      const newMessage = {
        id: short().new(),
        text: data.message.text,
        senderId: user._id,
        timestamp: new Date().toISOString(),
        status: 'sent' as const,
        replyTo: data.message.replyTo
      };

      // Update messages store
      messages.set(actualConversationId, [
        ...(messages.get(actualConversationId) || []),
        newMessage
      ]);

      // Update conversation metadata
      conversation.lastMessage = newMessage.text;
      conversation.lastMessageTime = newMessage.timestamp;

      // Broadcast to conversation room
      io.to(actualConversationId).emit('new_message', {
        conversationId: actualConversationId,
        message: newMessage
      });

      console.log(`Message sent to conversation ${actualConversationId}`);

      if (callback && typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (error) {
      console.error('Message sending error:', error);
      if (callback && typeof callback === 'function') {
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Disconnection handler
  socket.on('disconnect', (reason: string) => {
    console.log(`Disconnect (${socket.id}): ${reason}`);
    activeUsers.delete(user._id);
    broadcastOnlineUsers();
  });
});

// Start server
const PORT: number = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
