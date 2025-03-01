// Simple script to test the delete functionality against our local test server
const axios = require('axios');

// Test parameters
const userId = 'aot39WjGKBW3ZhnnwPtZZmfXBfi2';
const topicId = '67a4c31ded27b56fc01cb08e';
const categoryType = 'webpage';
const materialId = '67bb5fbab51519857a1d15a0';

// Base URL - default to local test server
const baseUrl = 'http://localhost:3001';

async function testDeleteMaterial() {
  console.log('=== Testing DELETE Material Functionality ===');
  console.log(`Server: ${baseUrl}`);
  console.log(`User ID: ${userId}`);
  console.log(`Topic ID: ${topicId}`);
  console.log(`Category: ${categoryType}`);
  console.log(`Material ID: ${materialId}`);
  console.log('===========================================');

  // 1. Test the test route
  console.log('\n1. Testing test route...');
  try {
    const testResponse = await axios.get(`${baseUrl}/test`);
    console.log(`Status: ${testResponse.status}`);
    console.log('Response:', testResponse.data);
  } catch (error) {
    console.error('Test route failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }

  // 2. Test the debug routes
  console.log('\n2. Testing debug routes...');
  try {
    const routesResponse = await axios.get(`${baseUrl}/debug/routes`);
    console.log(`Status: ${routesResponse.status}`);
    console.log('Routes:', routesResponse.data);
  } catch (error) {
    console.error('Debug routes failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }

  // 3. Test the delete material route
  console.log('\n3. Testing delete material route...');
  const deleteUrl = `${baseUrl}/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
  console.log(`DELETE ${deleteUrl}`);
  
  try {
    const deleteResponse = await axios.delete(deleteUrl);
    console.log(`Status: ${deleteResponse.status}`);
    console.log('Delete successful:', deleteResponse.data);
  } catch (error) {
    console.error('Delete failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }

  console.log('\nTest complete!');
}

testDeleteMaterial().catch(error => {
  console.error('Error in test:', error.message);
}); 