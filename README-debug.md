# Debugging the Delete Material Functionality

This README provides instructions for debugging the delete material functionality in your application.

## The Issue

The delete material functionality is returning a 404 error when trying to delete a material. The request is being sent to:

```
https://studylistserver-production.up.railway.app/api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId
```

But the server is not handling the request correctly.

## Debugging Tools

We've created several debugging tools to help diagnose and fix the issue:

### Server-Side Tools

1. **Get Token Helper** (`server/src/get-token.ts`)

   - Helps you get a Firebase token for testing
   - Run: `npx ts-node src/get-token.ts`

2. **Test Route Script** (`server/src/test-route.ts`)

   - Tests various routes on the server
   - Run: `npx ts-node src/test-route.ts`

3. **Test Delete Script** (`server/src/test-delete.ts`)

   - Focused test for the delete material functionality
   - Run: `npx ts-node src/test-delete.ts`

4. **Check Routes Script** (`server/src/check-routes.ts`)

   - Checks all registered routes on the server
   - Run: `npx ts-node src/check-routes.ts`

5. **Debug Railway Script** (`server/src/debug-railway.ts`)

   - Comprehensive debug script for the Railway server
   - Run: `npx ts-node src/debug-railway.ts`

6. **Deploy Fix Script** (`server/src/deploy-fix.ts`)
   - Helps deploy fixes to the Railway server
   - Run: `npx ts-node src/deploy-fix.ts`

### Client-Side Tools

1. **Test Delete Script** (`client/src/test-delete.ts`)
   - Tests the delete material functionality from the client
   - Use in browser console:
     ```javascript
     import { testDeleteMaterial } from "./test-delete";
     testDeleteMaterial("materialId", "topicId", "categoryType");
     ```

## Debugging Steps

Follow these steps to debug the issue:

1. **Get a Firebase Token**

   ```bash
   cd server
   npx ts-node src/get-token.ts
   ```

   Follow the instructions to get a token from your browser.

2. **Check Server Health and Routes**

   ```bash
   npx ts-node src/check-routes.ts
   ```

   This will check if the server is running and what routes are available.

3. **Test the Delete Functionality**

   ```bash
   npx ts-node src/test-delete.ts
   ```

   This will test the delete material functionality directly.

4. **Debug the Railway Server**

   ```bash
   npx ts-node src/debug-railway.ts
   ```

   This will run a comprehensive debug on the Railway server.

5. **Deploy Fixes to Railway**
   ```bash
   npx ts-node src/deploy-fix.ts
   railway up
   ```
   This will apply fixes to the server code and deploy them to Railway.

## Potential Fixes

Based on our analysis, here are the potential fixes:

1. **Fix the Route Definition in userRoutes.ts**

   - The route is defined as `'users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId'` (without a leading slash)
   - This is correct since the router is mounted at `/api`

2. **Add a Direct Route in index.ts**

   - Add a direct route for deleting materials as a backup solution
   - This is already implemented in the deploy-fix script

3. **Add Debug Routes**
   - Add debug routes to help diagnose the issue
   - This is already implemented in the deploy-fix script

## Testing in the Browser

You can also test the delete functionality directly in your browser:

1. Open your application in the browser
2. Open the developer console (F12)
3. Run the following code:
   ```javascript
   import { testDeleteMaterial } from "./test-delete";
   testDeleteMaterial(
     "67bb5fbab51519857a1d15a0",
     "67a4c31ded27b56fc01cb08e",
     "webpage"
   );
   ```
   (Replace the IDs with your actual material, topic, and category)

## Conclusion

By following these steps and using the provided tools, you should be able to diagnose and fix the delete material functionality issue. If you need further assistance, please provide the output from the debug scripts.
