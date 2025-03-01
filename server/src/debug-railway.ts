import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// We'll use dynamic import for fetch
const runDebug = async () => {
  const { default: fetch } = await import('node-fetch');

  // Get token from environment
  const token = process.env.TEST_TOKEN || '';

  if (!token) {
    console.error('Please set TEST_TOKEN environment variable with a valid Firebase token');
    console.error('Run: npx ts-node src/get-token.ts');
    process.exit(1);
  }

  // Test parameters - you can modify these as needed
  const userId = 'aot39WjGKBW3ZhnnwPtZZmfXBfi2';
  const topicId = '67a4c31ded27b56fc01cb08e';
  const categoryType = 'webpage';
  const materialId = '67bb5fbab51519857a1d15a0';

  // Base URL - default to Railway deployment
  const baseUrl = process.env.SERVER_URL || 'https://studylistserver-production.up.railway.app';

  async function debugRailway() {
    console.log('=== Railway Server Debug ===');
    console.log(`Server: ${baseUrl}`);
    console.log(`User ID: ${userId}`);
    console.log(`Topic ID: ${topicId}`);
    console.log(`Category: ${categoryType}`);
    console.log(`Material ID: ${materialId}`);
    console.log('============================');

    // 1. Check health endpoint
    console.log('\n1. Checking health endpoint...');
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      console.log(`Status: ${healthResponse.status} ${healthResponse.statusText}`);
      
      if (healthResponse.ok) {
        const data = await healthResponse.json();
        console.log('Health response:', data);
      } else {
        console.error('Health check failed');
      }
    } catch (error) {
      console.error('Error checking health:', error);
    }

    // 2. Check debug routes endpoint (if available)
    console.log('\n2. Checking debug routes endpoint...');
    try {
      const routesResponse = await fetch(`${baseUrl}/debug/routes`);
      console.log(`Status: ${routesResponse.status} ${routesResponse.statusText}`);
      
      if (routesResponse.ok) {
        const data = await routesResponse.json() as { routes: Array<{ method: string; path: string }> };
        console.log('Routes:', data);
        
        // Check if our delete route is registered
        const deleteRoute = `/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
        const foundRoute = data.routes.find((r) => 
          r.method.includes('DELETE') && 
          (r.path === '/api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId' ||
           r.path === 'users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId')
        );
        
        if (foundRoute) {
          console.log('Delete route is registered:', foundRoute);
        } else {
          console.error('Delete route is NOT registered!');
        }
      } else {
        console.log('Debug routes endpoint not available');
      }
    } catch (error) {
      console.error('Error checking routes:', error);
    }

    // 3. Check debug delete route endpoint (if available)
    console.log('\n3. Checking debug delete route endpoint...');
    try {
      const deleteDebugResponse = await fetch(`${baseUrl}/debug/delete-route`);
      console.log(`Status: ${deleteDebugResponse.status} ${deleteDebugResponse.statusText}`);
      
      if (deleteDebugResponse.ok) {
        const data = await deleteDebugResponse.json();
        console.log('Delete route debug:', data);
      } else {
        console.log('Debug delete route endpoint not available');
      }
    } catch (error) {
      console.error('Error checking delete route debug:', error);
    }

    // 4. Try to get the material
    console.log('\n4. Trying to get the material...');
    const getUrl = `${baseUrl}/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
    console.log(`GET ${getUrl}`);
    
    try {
      const getResponse = await fetch(getUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Status: ${getResponse.status} ${getResponse.statusText}`);
      
      if (getResponse.ok) {
        const data = await getResponse.json();
        console.log('Material found:', data);
      } else {
        const text = await getResponse.text();
        console.error('Material not found:', text);
      }
    } catch (error) {
      console.error('Error getting material:', error);
    }

    // 5. Try to delete the material
    console.log('\n5. Trying to delete the material...');
    const deleteUrl = `${baseUrl}/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
    console.log(`DELETE ${deleteUrl}`);
    
    try {
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Status: ${deleteResponse.status} ${deleteResponse.statusText}`);
      
      if (deleteResponse.ok) {
        const data = await deleteResponse.json();
        console.log('Delete successful:', data);
      } else {
        const text = await deleteResponse.text();
        console.error('Delete failed:', text);
      }
    } catch (error) {
      console.error('Error deleting material:', error);
    }

    console.log('\nDebug complete!');
  }

  await debugRailway();
};

runDebug(); 