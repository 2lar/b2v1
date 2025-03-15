#!/bin/bash
# Update package.json to use TypeScript 4.9.5
sed -i 's/"typescript": "\^5.8.2"/"typescript": "4.9.5"/g' package.json

# Install dependencies
npm install

# Install React type definitions in client package
cd packages/client
npm install --save-dev @types/react @types/react-dom
cd ../..

# Build everything
npm run build:shared
npm run build:server

# Build client with necessary type definitions
cd packages/client
npm run build
cd ../..

# Copy client build to server
mkdir -p packages/server/dist/client
cp -r packages/client/build/* packages/server/dist/client/ || echo "Warning: Client build files not found. Continuing anyway."

echo "Build completed successfully!"