import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test parameters
const userId = 'aot39WjGKBW3ZhnnwPtZZmfXBfi2';
const topicId = '67a4c31ded27b56fc01cb08e';
const categoryType = 'webpage';
const materialId = '67bb5fbab51519857a1d15a0';

// Get a valid token (you'll need to provide this)
const token = process.env.TEST_TOKEN || '';

if (!token) {
  console.error('Please set TEST_TOKEN environment variable with a valid Firebase token');
  process.exit(1);
}

// Base URL - default to Railway deployment
const baseUrl = process.env.SERVER_URL || 'https://studylistserver-production.up.railway.app';

console.log(`Testing against server: ${baseUrl}`);

// Test routes
const routes = [
  // Test the basic health endpoint
  {
    method: 'GET',
    url: `${baseUrl}/health`,
    description: 'Health check'
  },
  // Test the simple test route
  {
    method: 'GET',
    url: `${baseUrl}/test/route/param1/param2?query1=value1`,
    description: 'Simple test route'
  },
  // Test the GET material route
  {
    method: 'GET',
    url: `${baseUrl}/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`,
    description: 'GET material'
  },
  // Test the DELETE material route
  {
    method: 'DELETE',
    url: `${baseUrl}/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`,
    description: 'DELETE material'
  },
  // Test the direct DELETE route we added as a backup
  {
    method: 'DELETE',
    url: `${baseUrl}/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`,
    description: 'Direct DELETE route'
  }
];

// Run tests
async function runTests() {
  console.log('Starting route tests...');
  
  for (const route of routes) {
    console.log(`\nTesting: ${route.description}`);
    console.log(`${route.method} ${route.url}`);
    
    try {
      const response = await fetch(route.url, {
        method: route.method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        console.log('Response:', text);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  console.log('\nTests completed');
}

runTests(); 