import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import stripeRoutes from './routes/stripeRoutes';

dotenv.config();

console.log('MongoDB URI:', process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3001', // 前端地址
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    params: req.params,
    headers: req.headers
  });
  next();
});

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
app.use('/api/stripe', stripeRoutes);

// Add before other routes
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/health', (req, res) => {
  res.json({
    server: 'running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});