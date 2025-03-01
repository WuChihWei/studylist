/**
 * Test script for delete material functionality
 * 
 * To use this script:
 * 1. Copy this file to your client/src directory
 * 2. Open your browser console
 * 3. Import the function:
 *    import { testDeleteMaterial } from './test-delete';
 * 4. Call the function with your parameters:
 *    testDeleteMaterial('materialId', 'topicId', 'categoryType');
 */

// Test parameters - you can modify these as needed
const DEFAULT_MATERIAL_ID = '67bb5fbab51519857a1d15a0';
const DEFAULT_TOPIC_ID = '67a4c31ded27b56fc01cb08e';
const DEFAULT_CATEGORY_TYPE = 'webpage';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://studylistserver-production.up.railway.app';

/**
 * Test the delete material functionality
 */
export async function testDeleteMaterial(
  materialId = DEFAULT_MATERIAL_ID,
  topicId = DEFAULT_TOPIC_ID,
  categoryType = DEFAULT_CATEGORY_TYPE
) {
  console.log('=== Testing DELETE Material Functionality ===');
  console.log(`Server: ${API_URL}`);
  console.log(`Material ID: ${materialId}`);
  console.log(`Topic ID: ${topicId}`);
  console.log(`Category: ${categoryType}`);
  console.log('===========================================');

  try {
    // Get the current user
    const firebase = (window as any).firebase;
    if (!firebase || !firebase.auth) {
      console.error('Firebase not available. Make sure you are logged in.');
      return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('No user logged in. Please log in first.');
      return;
    }

    console.log(`User ID: ${user.uid}`);
    
    // Get a fresh token
    const token = await user.getIdToken(true);
    console.log('Token obtained successfully');

    // First, check if the material exists
    console.log('\n1. Checking if material exists...');
    const getUrl = `${API_URL}/api/users/${user.uid}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
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
      console.error('Error checking material:', error);
    }

    // Now try to delete the material
    console.log('\n2. Attempting to delete material...');
    const deleteUrl = `${API_URL}/api/users/${user.uid}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
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
        return true;
      } else {
        const text = await deleteResponse.text();
        console.error('Delete failed:', text);
        return false;
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      return false;
    }
  } catch (error) {
    console.error('Test error:', error);
    return false;
  }
}

// Export a function to test with specific parameters
export function testDelete(materialId: string, topicId: string, categoryType: string) {
  return testDeleteMaterial(materialId, topicId, categoryType);
} 