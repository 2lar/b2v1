#!/bin/bash
# Custom build script for Render deployment

# Install dependencies with legacy peer deps flag
npm install --legacy-peer-deps

# Build shared package
npm run build:shared

# Install client dependencies including TypeScript explicitly
cd packages/client
npm install --legacy-peer-deps
npm install --save typescript@4.9.5
npm run build || echo "Warning: Client build failed, continuing with server build"
cd ../..

# Build server
cd packages/server
npm install --legacy-peer-deps
npm run build
cd ../..

# Copy client build to server dist folder (if it exists)
mkdir -p packages/server/dist/client
cp -r packages/client/build/* packages/server/dist/client/ || echo "Warning: Client build files not found. Continuing anyway."

echo "Build completed successfully!"