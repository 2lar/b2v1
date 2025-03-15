#!/bin/bash
# Custom build script for Render deployment

# Install dependencies with legacy peer deps flag
npm install --legacy-peer-deps

# Build shared package
npm run build:shared

# Handle client build with compatible TypeScript version
cd packages/client
echo "Setting up client build with compatible TypeScript version..."

# Remove any existing TypeScript
rm -rf node_modules/typescript

# Force install the compatible version of TypeScript
npm install typescript@4.9.5 --save-exact --no-package-lock

# Clear React Scripts cache
rm -rf node_modules/.cache

# Try to build with the compatible TypeScript version
echo "Building client with TypeScript 4.9.5..."
npm run build

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