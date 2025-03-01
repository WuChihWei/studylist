"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
// Load environment variables
dotenv_1.default.config();
// Create readline interface
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
console.log(`
=== Firebase Token Helper ===

This script helps you get a Firebase token for testing.

Instructions:
1. Open your browser's developer tools (F12)
2. Go to your application (https://studylist-coral.vercel.app)
3. Make sure you're logged in
4. In the developer console, run this command:
   
   await firebase.auth().currentUser.getIdToken()
   
5. Copy the token that appears
6. Paste it below
`);
rl.question('Paste your Firebase token: ', (token) => {
    // Save token to .env file
    const envContent = fs_1.default.existsSync('.env')
        ? fs_1.default.readFileSync('.env', 'utf8')
        : '';
    // Check if TEST_TOKEN already exists
    if (envContent.includes('TEST_TOKEN=')) {
        // Replace existing token
        const updatedContent = envContent.replace(/TEST_TOKEN=.*/, `TEST_TOKEN=${token}`);
        fs_1.default.writeFileSync('.env', updatedContent);
    }
    else {
        // Add new token
        fs_1.default.writeFileSync('.env', `${envContent}\nTEST_TOKEN=${token}`);
    }
    console.log('\nToken saved to .env file as TEST_TOKEN');
    console.log('You can now run the test script with:');
    console.log('node src/simple-check.js');
    rl.close();
});
