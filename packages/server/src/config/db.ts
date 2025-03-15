import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';


// Load environment variables
const envPath = path.resolve(__dirname, '../../../../.env');
// console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

// MongoDB connection URI (using environment variable or default to localhost)
const MONGODB_URI = process.env.MONGODB_URI as string;
/**
 * Connect to MongoDB 
 */
export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false);
    console.log("trying to conncet to mongoooose");
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB (useful for tests)
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

export default connectDB;