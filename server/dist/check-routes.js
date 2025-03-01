"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import fetch from 'node-fetch';
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// We'll use dynamic import for fetch
const runChecks = async () => {
    const { default: fetch } = await Promise.resolve().then(() => __importStar(require('node-fetch')));
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
            }
            else {
                console.error('Health check failed');
            }
            // Try to get a list of routes (if available)
            console.log('\nChecking for route list...');
            const routesResponse = await fetch(`${baseUrl}/debug/routes`);
            if (routesResponse.ok) {
                const routesData = await routesResponse.json();
                console.log('Routes:', routesData);
            }
            else {
                console.log('Route list not available');
            }
            // Check a test route
            console.log('\nChecking test route...');
            const testResponse = await fetch(`${baseUrl}/test/route/param1/param2`);
            if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log('Test route response:', testData);
            }
            else {
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
            }
            else {
                console.log('Auth test failed or not available');
            }
        }
        catch (error) {
            console.error('Error checking routes:', error);
        }
    }
    await checkRoutes();
};
runChecks();
