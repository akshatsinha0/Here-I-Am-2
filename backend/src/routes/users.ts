import express, { RequestHandler } from 'express';
import User from '../models/User';

const router = express.Router();

const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

const getUserHandler: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    let user;
    if (isValidObjectId(userId)) {
      user = await User.findById(userId)
        .select('-password -__v -createdAt -updatedAt');
    } else {
      user = await User.findOne({ username: userId })
        .select('-password -__v -createdAt -updatedAt');
    }

    if (!user) {
      res.status(404).json({ 
        message: 'User not found',
        suggestion: userId.includes('@') ? 'Try searching by username instead of email' : ''
      });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: 'Failed to retrieve user information' 
    });
  }
};

const updateUserHandler: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, avatar } = req.body;
    
    if (!username && !avatar) {
      res.status(400).json({ 
        message: 'No update data provided',
        suggestion: 'Include either username or avatar in the request body'
      });
      return;
    }

    const updateData: { username?: string; avatar?: string } = {};
    if (username) updateData.username = username;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      message: 'Update failed',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

const getAllUsersHandler: RequestHandler = async (_req, res) => {
  try {
    const users = await User.find()
      .select('username email avatar')
      .sort({ createdAt: -1 });
      
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve users',
      details: 'Database query error'
    });
  }
};

router.get('/:userId', getUserHandler);
router.put('/:userId', updateUserHandler);
router.get('/', getAllUsersHandler);

export default router;
