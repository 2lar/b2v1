#!/bin/bash
# This script will build the project without manually stripping TypeScript annotations

# Install dependencies
npm install

# Build shared and server packages
npm run build:shared
npm run build:server

# Build client code without modifying TypeScript annotations
cd packages/client
echo "Building client code..."
GENERATE_SOURCEMAP=false CI=false npm run build

cd ../..

# Copy client build to server in the exact path the server is looking for
mkdir -p packages/server/dist/client/build
cp -r packages/client/build/* packages/server/dist/client/build/

echo "Build completed successfully!"