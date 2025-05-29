import express, { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import asyncHandler from 'express-async-handler';
import { Types } from 'mongoose';
import mongoose from 'mongoose';

const router = express.Router();

// Get all conversations for a user with populated data
router.get('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  if (!mongoose.isValidObjectId(userId)) {
    res.status(400).json({ error: 'Invalid user ID format' });
    return;
  }

  try {
    const conversations = await Conversation.find({
      participants: new Types.ObjectId(userId)
    })
    .populate({
      path: 'latestMessage',
      select: 'text senderId timestamp'
    })
    .populate({
      path: 'participants',
      select: 'username email avatar'
    })
    .sort({ updatedAt: -1 })
    .lean();

    const formattedConversations = conversations.map(conv => ({
      ...conv,
      unreadCount: conv.unreadCount instanceof Map ? 
        Object.fromEntries(conv.unreadCount) : 
        conv.unreadCount
    }));

    res.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
}));

// Get single conversation by ID
router.get('/:conversationId', asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  
  if (!mongoose.isValidObjectId(conversationId)) {
    res.status(400).json({ error: 'Invalid conversation ID format' });
    return;
  }

  try {
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'username avatar')
      .populate('latestMessage');

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const response = {
      ...conversation.toObject(),
      unreadCount: conversation.unreadCount instanceof Map ?
        Object.fromEntries(conversation.unreadCount) :
        conversation.unreadCount
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Server error' });
  }
}));
router.post('/', asyncHandler(async (_: Request, res: Response) => {
  const newConversation = new Conversation({
    _id: new Types.ObjectId(), // Let MongoDB generate the ID
    // ... other fields
  });
  await newConversation.save();
  res.status(201).json(newConversation);
}));

export default router;
