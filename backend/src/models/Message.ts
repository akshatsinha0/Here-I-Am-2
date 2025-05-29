import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: string;
  text: string;
  senderId: string;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    readBy: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: function(this: IMessage) {
        // Automatically mark as read by sender
        return [this.senderId];
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Index for faster querying on common fields
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
