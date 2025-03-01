// Simple script to test the routes locally
const express = require('express');
const app = express();

// Add middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Params:', JSON.stringify(req.params, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Add a test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

// Add a route to list all routes
app.get('/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const methods = Object.keys(middleware.route.methods);
      routes.push({
        method: methods.join(',').toUpperCase(),
        path: middleware.route.path
      });
    }
  });
  
  res.json({ routes });
});

// Add a direct route for deleting materials
app.delete('/api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId', (req, res) => {
  console.log('\n=== DIRECT DELETE ROUTE HIT ===');
  console.log('Request params:', req.params);
  console.log('Request path:', req.path);
  console.log('Original URL:', req.originalUrl);
  console.log('======================\n');
  
  res.json({ 
    message: 'Material deleted successfully',
    params: req.params
  });
});

// Add a 404 handler
app.use('*', (req, res) => {
  console.log('Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- GET /test');
  console.log('- GET /debug/routes');
  console.log('- DELETE /api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId');
}); 