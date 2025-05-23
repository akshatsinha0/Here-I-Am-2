import { Document, Schema, model, Types } from 'mongoose';

/**
 * User interface with proper TypeScript typing
 */
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    lowercase: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: '/default-avatar.png'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual field for frontend ID compatibility
userSchema.virtual('id').get(function(this: IUser) {
  return this._id.toString();
});

// Case-insensitive indexes
// userSchema.index({ username: 1 }, { 
//   unique: true,
//   collation: { locale: 'en', strength: 2 },
//   background: true
// });

// userSchema.index({ email: 1 }, { 
//   unique: true,
//   collation: { locale: 'en', strength: 2 },
//   background: true
// });

// Error handling for duplicate keys
userSchema.post('save', function (error: any, _doc: IUser, next: (err?: Error) => void) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const value = error.keyValue[field];
    next(new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" is already registered`));
  } else {
    next(error);
  }
});

// Query middleware to exclude password by default
const excludePassword = function(this: any, next: () => void) {
  this.select('-password');
  next();
};

userSchema.pre('find', excludePassword);
userSchema.pre('findOne', excludePassword);
userSchema.pre('findOneAndUpdate', excludePassword);

export default model<IUser>('User', userSchema);
