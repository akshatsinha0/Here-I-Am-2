import mongoose from 'mongoose';
import 'dotenv/config';

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    
    console.log('MongoDB connected successfully');
  } catch (err) {
    const error = err as Error;
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
