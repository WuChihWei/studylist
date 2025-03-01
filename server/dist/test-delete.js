"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Test parameters - you can modify these as needed
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
async function testDeleteMaterial() {
    console.log('=== Testing DELETE Material Functionality ===');
    console.log(`Server: ${baseUrl}`);
    console.log(`User ID: ${userId}`);
    console.log(`Topic ID: ${topicId}`);
    console.log(`Category: ${categoryType}`);
    console.log(`Material ID: ${materialId}`);
    console.log('===========================================');
    // First, check if the material exists
    console.log('\n1. Checking if material exists...');
    const getUrl = `${baseUrl}/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
    console.log(`GET ${getUrl}`);
    try {
        const getResponse = await (0, node_fetch_1.default)(getUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`Status: ${getResponse.status} ${getResponse.statusText}`);
        console.log('Response Headers:', getResponse.headers);
        if (getResponse.ok) {
            const data = await getResponse.json();
            console.log('Material found:', JSON.stringify(data, null, 2));
        }
        else {
            const text = await getResponse.text();
            console.error('Material not found:', text);
            console.log('\nTesting alternative routes...');
        }
    }
    catch (error) {
        console.error('Error checking material:', error);
    }
    // Now try to delete the material
    console.log('\n2. Attempting to delete material...');
    const deleteUrl = `${baseUrl}/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
    console.log(`DELETE ${deleteUrl}`);
    try {
        const deleteResponse = await (0, node_fetch_1.default)(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`Status: ${deleteResponse.status} ${deleteResponse.statusText}`);
        console.log('Response Headers:', deleteResponse.headers);
        if (deleteResponse.ok) {
            const data = await deleteResponse.json();
            console.log('Delete successful:', JSON.stringify(data, null, 2));
        }
        else {
            const text = await deleteResponse.text();
            console.error('Delete failed:', text);
        }
    }
    catch (error) {
        console.error('Error deleting material:', error);
    }
    // Try the direct route as a fallback
    console.log('\n3. Trying direct route as fallback...');
    const directUrl = `${baseUrl}/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
    console.log(`DELETE ${directUrl}`);
    try {
        const directResponse = await (0, node_fetch_1.default)(directUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`Status: ${directResponse.status} ${directResponse.statusText}`);
        console.log('Response Headers:', directResponse.headers);
        if (directResponse.ok) {
            const data = await directResponse.json();
            console.log('Direct delete successful:', JSON.stringify(data, null, 2));
        }
        else {
            const text = await directResponse.text();
            console.error('Direct delete failed:', text);
        }
    }
    catch (error) {
        console.error('Error with direct delete:', error);
    }
}
testDeleteMaterial();
