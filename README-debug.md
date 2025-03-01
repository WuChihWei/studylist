# Debugging the Delete Material Functionality

## The Issue

When attempting to delete a material, the client sends a DELETE request to the following URL:

```
https://studylistserver-production.up.railway.app/api/users/aot39WjGKBW3ZhnnwPtZZmfXBfi2/topics/67a4c31ded27b56fc01cb08e/categories/webpage/materials/67bb5fbab51519857a1d15a0
```

However, the server responds with a 404 error, indicating that the route is not found.

## Debugging Tools

We've created several tools to help diagnose and fix the issue:

### Server-Side Tools

1. **`server/src/get-token.ts`**: A script to obtain a Firebase token for testing.
2. **`server/src/test-route.ts`**: A script to test various routes on the server.
3. **`server/src/test-delete.ts`**: A script specifically for testing the delete functionality.
4. **`server/src/check-routes.ts`**: A script to check all registered routes on the server.
5. **`server/src/debug-railway.ts`**: A comprehensive script for debugging the Railway server.
6. **`server/src/deploy-fix.ts`**: A script to deploy fixes to the Railway server.

### Client-Side Tools

1. **`client/src/test-delete.ts`**: A script to test the delete functionality from the client side.

## Debugging Steps

1. **Get a Firebase Token**:

   ```bash
   cd server
   npx ts-node src/get-token.ts
   ```

   Follow the instructions to obtain a Firebase token and save it to the `.env` file.

2. **Check Server Health and Routes**:

   ```bash
   node src/simple-check.js
   ```

   This will check the server's health endpoint and attempt to get and delete a material.

3. **Test Delete Functionality**:

   ```bash
   npx ts-node src/test-delete.ts
   ```

   This will test the delete functionality with the token from the `.env` file.

4. **Debug Railway Server**:

   ```bash
   npx ts-node src/debug-railway.ts
   ```

   This will perform a comprehensive debug of the Railway server, checking routes and attempting to delete a material.

5. **Deploy Fixes to Railway**:
   ```bash
   npx ts-node src/deploy-fix.ts
   railway up
   ```
   This will apply fixes to the server code and deploy them to Railway.

## Potential Fixes

Based on our analysis, the issue could be one of the following:

1. **Route Definition**: The route for deleting materials is defined in `userRoutes.ts` as `'users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId'` (without a leading slash), and the router is mounted at `/api`. This should result in the full path being `/api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId`, which matches the client's request.

2. **Direct Route**: We've added a direct route in `index.ts` as a backup solution:

   ```javascript
   app.delete(
     "/api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId",
     authMiddleware,
     deleteMaterial
   );
   ```

   This should handle the delete request directly, bypassing the router.

3. **Debug Routes**: We've added a debug route to list all registered routes:
   ```javascript
   app.get("/debug/routes", (req, res) => {
     // List all routes
   });
   ```
   This can help identify if the delete route is properly registered.

## Testing in the Browser

You can also test the delete functionality directly in the browser console:

1. Open your browser's developer tools (F12)
2. Go to your application (https://studylist-coral.vercel.app)
3. Make sure you're logged in
4. In the developer console, run this command:

   ```javascript
   // Get a token
   const token = await firebase.auth().currentUser.getIdToken();

   // Test the delete functionality
   fetch(
     "https://studylistserver-production.up.railway.app/api/users/aot39WjGKBW3ZhnnwPtZZmfXBfi2/topics/67a4c31ded27b56fc01cb08e/categories/webpage/materials/67bb5fbab51519857a1d15a0",
     {
       method: "DELETE",
       headers: {
         Authorization: `Bearer ${token}`,
         "Content-Type": "application/json",
       },
     }
   )
     .then((response) => {
       console.log("Status:", response.status);
       return response.json();
     })
     .then((data) => console.log("Response:", data))
     .catch((error) => console.error("Error:", error));
   ```

## Conclusion

Follow the steps above to diagnose and fix the issue with the delete material functionality. If you need further assistance, please provide the output from the debug scripts.
