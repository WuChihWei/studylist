import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8080;

// Basic middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint accessed');
  console.log('Request headers:', req.headers);
  
  res.json({
    message: 'Test successful',
    origin: req.headers.origin || 'No origin',
    timestamp: new Date().toISOString()
  });
});

// Start the server
try {
  const server = app.listen(PORT, () => {
    console.log(`Test server is running on port ${PORT}`);
  });
  
  server.on('error', (error: any) => {
    console.error('Server error:', error);
  });
  
  // Keep the process alive
  process.stdin.resume();
  
  process.on('SIGINT', () => {
    console.log('Shutting down server gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
} catch (error) {
  console.error('Error starting server:', error);
} 