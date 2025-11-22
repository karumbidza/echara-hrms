#!/bin/bash

# ECHARA HRMS Quick Start Script

echo "🏢 ECHARA HRMS - Starting Development Environment"
echo "================================================="
echo ""

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

if ! command_exists psql; then
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and running."
fi

echo "✅ Node.js $(node -v)"
echo "✅ npm $(npm -v)"
echo ""

# Setup backend
echo "📦 Setting up backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found in backend. Creating template..."
    cat > .env << EOL
DATABASE_URL="postgresql://localhost:5432/echara_hrms?schema=public"
JWT_SECRET="your-secret-jwt-key-change-in-production"
PORT=5000
NODE_ENV=development
EOL
    echo "⚠️  Please configure your database connection in backend/.env"
fi

echo "Generating Prisma Client..."
npx prisma generate

echo "✅ Backend setup complete"
cd ..

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "✅ Frontend setup complete"
cd ..

echo ""
echo "================================================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Configure database in backend/.env"
echo "2. Run: npx prisma db push (in backend directory)"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start frontend: cd frontend && npm start"
echo ""
echo "📚 Read README.md for detailed instructions"
echo "================================================="
