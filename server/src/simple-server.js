const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.method, req.url);
  console.log('Headers:', req.headers);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Handle normal requests
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Simple server is working!',
    timestamp: new Date().toISOString(),
    headers: req.headers
  }));
});

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`Simple server running at http://localhost:${PORT}/`);
});

// Keep the process alive
process.stdin.resume();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 