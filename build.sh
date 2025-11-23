#!/bin/bash
set -e

echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la

echo "Changing to frontend directory..."
cd frontend

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Building React app..."
npm run build

echo "Build complete!"
