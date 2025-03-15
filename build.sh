#!/bin/bash
# Custom build script for Render deployment

# Install dependencies
npm install

# Build shared package
npm run build:shared

# Install client dependencies and build
cd packages/client
npm install
npm run build
cd ../..

# Install server dependencies and build
cd packages/server
npm install
npm run build
cd ../..

# Copy client build to server dist folder
mkdir -p packages/server/dist/client
cp -r packages/client/build/* packages/server/dist/client/

echo "Build completed successfully!"