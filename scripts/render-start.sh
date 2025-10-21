#!/bin/bash

# Create database directory
mkdir -p /app/db

# Copy database file if it exists in the build
if [ -f "./db/custom.db" ]; then
    cp ./db/custom.db /app/db/custom.db
fi

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Always seed the database to ensure there's data
echo "Seeding database with initial data..."
npx tsx prisma/seed.ts

# Start the application
npm start