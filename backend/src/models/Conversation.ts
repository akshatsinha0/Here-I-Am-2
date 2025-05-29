import { Document, Schema, model, Types } from 'mongoose';
import { IMessage } from './Message';

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  name: string;
  avatar: string;
  latestMessage?: Types.ObjectId | IMessage;
  latestMessageTime?: Date;
  unreadCount: Map<string, number>;
  readBy: Types.ObjectId[];
  isGroup: boolean;
  isSelfChat: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      validate: {
        validator: function(this: IConversation, val: Types.ObjectId[]) {
          return this.isGroup ? val.length >= 2 : val.length === 2;
        },
        message: 'Conversation must have 2 participants unless it\'s a group chat'
      }
    }],
    name: {
      type: String,
      required: function(this: IConversation) {
        return this.isGroup || this.isSelfChat;
      },
      default: function(this: IConversation) {
        return this.isSelfChat ? 'Yourself' : undefined;
      }
    },
    avatar: {
      type: String,
      default: '/default-group-avatar.png'
    },
    latestMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    latestMessageTime: Date,
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map()
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    isGroup: {
      type: Boolean,
      default: false
    },
    isSelfChat: {
      type: Boolean,
      default: false
    }
  }, 
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(_doc: any, ret: any) { // Fixed parameter names and types
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        
        if (ret.unreadCount instanceof Map) {
          ret.unreadCount = Object.fromEntries(ret.unreadCount);
        }
      }
    },
    toObject: { virtuals: true }
  }
);

conversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId'
});

conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ latestMessage: 1 });
conversationSchema.index({ isSelfChat: 1 });
conversationSchema.index({ 'unreadCount.$**': 1 });

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
