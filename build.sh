#!/bin/bash
# Custom build script for Render deployment

# Install dependencies with legacy peer deps flag to bypass TypeScript version conflicts
npm install --legacy-peer-deps

# Build shared package
npm run build:shared

# Install client dependencies and build with legacy peer deps
cd packages/client
npm install --legacy-peer-deps
npm run build
cd ../..

# Install server dependencies and build
cd packages/server
npm install --legacy-peer-deps
npm run build
cd ../..

# Copy client build to server dist folder
mkdir -p packages/server/dist/client
cp -r packages/client/build/* packages/server/dist/client/ || echo "Warning: Client build files not found. Continuing anyway."

echo "Build completed successfully!"