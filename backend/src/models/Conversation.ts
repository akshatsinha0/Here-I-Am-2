import { Document, Schema, model, Types } from 'mongoose';

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isGroup: boolean;
  isSelfChat: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: function(this: IConversation, val: Types.ObjectId[]) {
        return this.isGroup ? val.length >= 2 : val.length === 2
      },
      message: 'Conversation must have 2 participants unless it\'s a group chat'
    }
  }],
  name: {
    type: String,
    required: function(this: IConversation) {
      return this.isGroup || this.isSelfChat
    },
    default: function(this: IConversation) {
      return this.isSelfChat ? 'Yourself' : undefined
    }
  },
  avatar: {
    type: String,
    default: '/default-group-avatar.png'
  },
  lastMessage: String,
  lastMessageTime: Date,
  unreadCount: {
    type: Number,
    default: 0
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  isSelfChat: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster querying of user conversations
conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ isSelfChat: 1 });

// Prevent duplicate 1:1 conversations
conversationSchema.pre('save', async function(next) {
  if (!this.isGroup && !this.isSelfChat && this.participants.length === 2) {
    const existing = await Conversation.findOne({
      participants: { $all: this.participants },
      isGroup: false,
      isSelfChat: false
    });
    
    if (existing) {
      throw new Error('Conversation already exists between these users');
    }
  }
  next();
});

const Conversation = model<IConversation>('Conversation', conversationSchema);

export default Conversation;
