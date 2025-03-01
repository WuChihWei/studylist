import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get token from environment
const token = process.env.TEST_TOKEN || '';

if (!token) {
  console.error('Please set TEST_TOKEN environment variable with a valid Firebase token');
  console.error('Run: npx ts-node src/get-token.ts');
  process.exit(1);
}

// Base URL - default to Railway deployment
const baseUrl = process.env.SERVER_URL || 'https://studylistserver-production.up.railway.app';

async function checkRoutes() {
  console.log(`Checking routes on server: ${baseUrl}`);
  
  try {
    // First check the health endpoint
    console.log('\nChecking health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log(`Health status: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health response:', healthData);
    } else {
      console.error('Health check failed');
    }
    
    // Try to get a list of routes (if available)
    console.log('\nChecking for route list...');
    const routesResponse = await fetch(`${baseUrl}/debug/routes`);
    
    if (routesResponse.ok) {
      const routesData = await routesResponse.json();
      console.log('Routes:', routesData);
    } else {
      console.log('Route list not available');
    }
    
    // Check a test route
    console.log('\nChecking test route...');
    const testResponse = await fetch(`${baseUrl}/test/route/param1/param2`);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('Test route response:', testData);
    } else {
      console.log('Test route not available');
    }
    
    // Check auth with token
    console.log('\nChecking auth with token...');
    const authResponse = await fetch(`${baseUrl}/test/auth`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Auth test response:', authData);
    } else {
      console.log('Auth test failed or not available');
    }
    
  } catch (error) {
    console.error('Error checking routes:', error);
  }
}

checkRoutes(); 