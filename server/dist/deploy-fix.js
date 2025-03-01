"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
console.log(`
=== Railway Deployment Fix Helper ===

This script helps you deploy a fix to your Railway server.

Instructions:
1. Make sure you have the Railway CLI installed
   npm install -g @railway/cli

2. Login to Railway
   railway login

3. Link to your project
   railway link

4. Run this script to apply the fix
   npx ts-node src/deploy-fix.ts

5. Deploy the changes
   railway up
`);
// Create a debug route to list all routes
function addDebugRoute() {
    console.log('Adding debug route to list all routes...');
    const indexPath = path_1.default.join(__dirname, '..', 'src', 'index.ts');
    if (!fs_1.default.existsSync(indexPath)) {
        console.error(`File not found: ${indexPath}`);
        return false;
    }
    let indexContent = fs_1.default.readFileSync(indexPath, 'utf8');
    // Check if debug route already exists
    if (indexContent.includes('app.get(\'/debug/routes\'')) {
        console.log('Debug route already exists');
        return true;
    }
    // Add debug route before error handling middleware
    const debugRoute = `
// Debug route to list all routes
app.get('/debug/routes', (req: Request, res: Response) => {
  console.log('Debug route hit - listing all routes');
  
  const routes: {method: string; path: string}[] = [];
  
  // Get routes from the main app
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const methods = Object.keys(middleware.route.methods);
      routes.push({
        method: methods.join(',').toUpperCase(),
        path: middleware.route.path
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      const regexp = middleware.regexp.toString();
      
      // Get the base path from the regexp
      let basePath = '';
      const match = regexp.match(/^\\\/\\^\\\\\\\/([^\\\\]+)/);
      if (match) {
        basePath = '/' + match[1];
      }
      
      // Get routes from the router
      if (middleware.handle && middleware.handle.stack) {
        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) {
            const methods = Object.keys(handler.route.methods);
            const routePath = handler.route.path;
            const fullPath = routePath.startsWith('/') 
              ? basePath + routePath.substring(1) // Handle paths with leading slash
              : basePath + '/' + routePath;       // Handle paths without leading slash
            
            routes.push({
              method: methods.join(',').toUpperCase(),
              path: fullPath
            });
          }
        });
      }
    }
  });
  
  // Sort routes
  routes.sort((a, b) => a.path.localeCompare(b.path));
  
  res.json({
    routes,
    count: routes.length
  });
});

// Add a direct debug route for the delete material endpoint
app.get('/debug/delete-route', (req: Request, res: Response) => {
  const userId = req.query.userId || 'aot39WjGKBW3ZhnnwPtZZmfXBfi2';
  const topicId = req.query.topicId || '67a4c31ded27b56fc01cb08e';
  const categoryType = req.query.categoryType || 'webpage';
  const materialId = req.query.materialId || '67bb5fbab51519857a1d15a0';
  
  const deleteRoute = \`/api/users/\${userId}/topics/\${topicId}/categories/\${categoryType}/materials/\${materialId}\`;
  
  res.json({
    deleteRoute,
    directRouteExists: true,
    userRoutesExists: true,
    params: {
      userId,
      topicId,
      categoryType,
      materialId
    }
  });
});

// Error handling middleware`;
    // Replace the error handling middleware comment with our debug route
    indexContent = indexContent.replace('// Error handling middleware', debugRoute);
    // Write the updated content back to the file
    fs_1.default.writeFileSync(indexPath, indexContent);
    console.log('Debug route added successfully');
    return true;
}
// Add a direct route for deleting materials
function addDirectDeleteRoute() {
    console.log('Checking for direct delete route...');
    const indexPath = path_1.default.join(__dirname, '..', 'src', 'index.ts');
    if (!fs_1.default.existsSync(indexPath)) {
        console.error(`File not found: ${indexPath}`);
        return false;
    }
    let indexContent = fs_1.default.readFileSync(indexPath, 'utf8');
    // Check if direct delete route already exists
    if (indexContent.includes('app.delete(\'/api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId\'')) {
        console.log('Direct delete route already exists');
        return true;
    }
    console.log('Direct delete route not found, adding it...');
    // Add direct delete route after mounting routes
    const directDeleteRoute = `
// Direct route for deleting materials
app.delete('/api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId', 
  authMiddleware,
  (req, res, next) => {
    console.log('\\n=== DIRECT DELETE ROUTE HIT ===');
    console.log('Request params:', {
      userId: req.params.userId,
      topicId: req.params.topicId,
      categoryType: req.params.categoryType,
      materialId: req.params.materialId
    });
    console.log('Request path:', req.path);
    console.log('Original URL:', req.originalUrl);
    console.log('======================\\n');
    next();
  }, 
  deleteMaterial
);`;
    // Find the position to insert the direct delete route
    const mountRoutesIndex = indexContent.indexOf('// Mount routes');
    const errorHandlingIndex = indexContent.indexOf('// Error handling middleware');
    if (mountRoutesIndex === -1 || errorHandlingIndex === -1) {
        console.error('Could not find insertion point for direct delete route');
        return false;
    }
    // Insert the direct delete route after the mount routes section
    const beforeInsert = indexContent.substring(0, errorHandlingIndex);
    const afterInsert = indexContent.substring(errorHandlingIndex);
    indexContent = beforeInsert + directDeleteRoute + '\n\n' + afterInsert;
    // Write the updated content back to the file
    fs_1.default.writeFileSync(indexPath, indexContent);
    console.log('Direct delete route added successfully');
    return true;
}
// Fix the userRoutes.ts file
function fixUserRoutes() {
    console.log('Checking userRoutes.ts file...');
    const userRoutesPath = path_1.default.join(__dirname, '..', 'src', 'routes', 'userRoutes.ts');
    if (!fs_1.default.existsSync(userRoutesPath)) {
        console.error(`File not found: ${userRoutesPath}`);
        return false;
    }
    let userRoutesContent = fs_1.default.readFileSync(userRoutesPath, 'utf8');
    // Check if the route is already fixed
    if (userRoutesContent.includes('router.delete(\'users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId\'')) {
        console.log('userRoutes.ts already has the correct route definition');
        return true;
    }
    // Fix the route definition
    userRoutesContent = userRoutesContent.replace(/router\.delete\(\s*['"]users\/:userId\/topics\/:topicId\/categories\/:categoryType\/materials\/:materialId['"]/, 'router.delete(\'users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId\'');
    // Write the updated content back to the file
    fs_1.default.writeFileSync(userRoutesPath, userRoutesContent);
    console.log('userRoutes.ts fixed successfully');
    return true;
}
// Run the fixes
function applyFixes() {
    console.log('Applying fixes...');
    const debugRouteAdded = addDebugRoute();
    const directDeleteRouteAdded = addDirectDeleteRoute();
    const userRoutesFixed = fixUserRoutes();
    if (debugRouteAdded && directDeleteRouteAdded && userRoutesFixed) {
        console.log('\nAll fixes applied successfully!');
        console.log('Now you can deploy the changes to Railway:');
        console.log('  railway up');
    }
    else {
        console.error('\nSome fixes could not be applied.');
    }
}
applyFixes();
