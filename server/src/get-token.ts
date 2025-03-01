import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Create readline interface
const rl = readline.createInterface({
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
  const envContent = fs.existsSync('.env') 
    ? fs.readFileSync('.env', 'utf8') 
    : '';
  
  // Check if TEST_TOKEN already exists
  if (envContent.includes('TEST_TOKEN=')) {
    // Replace existing token
    const updatedContent = envContent.replace(
      /TEST_TOKEN=.*/,
      `TEST_TOKEN=${token}`
    );
    fs.writeFileSync('.env', updatedContent);
  } else {
    // Add new token
    fs.writeFileSync('.env', `${envContent}\nTEST_TOKEN=${token}`);
  }
  
  console.log('\nToken saved to .env file as TEST_TOKEN');
  console.log('You can now run the test script with:');
  console.log('npx ts-node src/test-route.ts');
  
  rl.close();
}); 