import express, { Request, Response } from 'express';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import asyncHandler from 'express-async-handler';
import { Types } from 'mongoose';
import mongoose from 'mongoose';

const router = express.Router();

interface MessageRequest {
  conversationId: string;
  text: string;
  senderId: string;
}

interface ReadRequest {
  messageIds: string[];
  userId: string;
  conversationId: string;
}

// Get messages for a conversation
router.get('/:conversationId', asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  
  if (!mongoose.isValidObjectId(conversationId)) {
    res.status(400).json({ error: 'Invalid conversation ID format' });
    return;
  }

  try {
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'username avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}));

// Send message endpoint
router.post('/send', asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, text, senderId } = req.body as MessageRequest;
  
  if (!conversationId || !text || !senderId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (!mongoose.isValidObjectId(conversationId) || !mongoose.isValidObjectId(senderId)) {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }

  try {
    const message = new Message({
      conversationId: new Types.ObjectId(conversationId),
      text,
      senderId: new Types.ObjectId(senderId),
      readBy: [new Types.ObjectId(senderId)]
    });
    
    const savedMessage = await message.save();

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: { 
          latestMessage: savedMessage._id,
          latestMessageTime: new Date()
        }
      },
      { new: true }
    ).populate('participants', 'id username avatar');

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const messageWithSender = await Message.populate(savedMessage, {
      path: 'senderId',
      select: 'id username avatar'
    });

    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}));

// Mark messages as read endpoint
router.post('/mark-read', asyncHandler(async (req: Request, res: Response) => {
  const { messageIds, userId, conversationId } = req.body as ReadRequest;

  if (!mongoose.isValidObjectId(conversationId) || !mongoose.isValidObjectId(userId)) {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }

  try {
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { readBy: new Types.ObjectId(userId) } }
    );

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { 
        $set: { [`unreadCount.${userId}`]: 0 },
        $addToSet: { readBy: new Types.ObjectId(userId) } 
      },
      { new: true }
    );

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({ 
      success: true,
      unreadCount: conversation.unreadCount 
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
}));

export default router;
