// Simple script to check server health and routes
const axios = require('axios');
require('dotenv').config();

// Test parameters
const userId = 'aot39WjGKBW3ZhnnwPtZZmfXBfi2';
const topicId = '67a4c31ded27b56fc01cb08e';
const categoryType = 'webpage';
const materialId = '67bb5fbab51519857a1d15a0';

// Get token from environment
const token = process.env.TEST_TOKEN || '';

if (!token) {
  console.error('Please set TEST_TOKEN environment variable with a valid Firebase token');
  console.error('Run: npx ts-node src/get-token.ts');
  process.exit(1);
}

// Base URL - default to Railway deployment
const baseUrl = process.env.SERVER_URL || 'https://studylistserver-production.up.railway.app';

async function simpleCheck() {
  console.log('=== Simple Server Check ===');
  console.log(`Server: ${baseUrl}`);
  console.log('==========================');

  // 1. Check health endpoint
  console.log('\n1. Checking health endpoint...');
  try {
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log(`Status: ${healthResponse.status}`);
    console.log('Health response:', healthResponse.data);
  } catch (error) {
    console.error('Health check failed:', error.message);
  }

  // 2. Try to get the material
  console.log('\n2. Trying to get the material...');
  const getUrl = `${baseUrl}/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
  console.log(`GET ${getUrl}`);
  
  try {
    const getResponse = await axios.get(getUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${getResponse.status}`);
    console.log('Material found:', getResponse.data);
  } catch (error) {
    console.error('Material not found:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }

  // 3. Try to delete the material
  console.log('\n3. Trying to delete the material...');
  const deleteUrl = `${baseUrl}/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
  console.log(`DELETE ${deleteUrl}`);
  
  try {
    const deleteResponse = await axios.delete(deleteUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${deleteResponse.status}`);
    console.log('Delete successful:', deleteResponse.data);
  } catch (error) {
    console.error('Delete failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }

  console.log('\nCheck complete!');
}

simpleCheck().catch(error => {
  console.error('Error in simple check:', error.message);
}); 