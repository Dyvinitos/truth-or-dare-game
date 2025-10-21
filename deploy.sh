#!/bin/bash

# Truth or Dare Game Deployment Script

set -e

echo "🎮 Starting Truth or Dare Game Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version check passed: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️ Building application..."
npm run build

# Create data directory if it doesn't exist
echo "📁 Creating data directory..."
mkdir -p data

# Set production environment
export NODE_ENV=production
export PORT=${PORT:-3000}
export HOSTNAME=${HOSTNAME:-0.0.0.0}
export DATABASE_URL="file:$(pwd)/data/database.db"

# Seed the database if it doesn't exist
if [ ! -f "data/database.db" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed
else
    echo "✅ Database already exists"
fi

# Health check
echo "🏥 Running health check..."
sleep 2
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "🌐 Application is running at: http://localhost:3000"
echo "🏥 Health check: http://localhost:3000/api/health"