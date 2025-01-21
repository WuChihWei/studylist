import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';

dotenv.config();

console.log('MongoDB URI:', process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // 前端地址
  credentials: true
}));
app.use(express.json());

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI is not defined in the environment variables');
}

// MongoDB connection
mongoose.connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('MongoDB connection state:', mongoose.connection.readyState);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.error('Connection details:', {
      uri: mongoUri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://***:***@'),
      readyState: mongoose.connection.readyState
    });
  });

// Routes
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});