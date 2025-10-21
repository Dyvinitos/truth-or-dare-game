#!/bin/bash

# Create database directory
mkdir -p /app/db

# Set the correct database URL for Render
export DATABASE_URL="file:/app/db/custom.db"

# Copy database file if it exists in the build
if [ -f "./db/custom.db" ]; then
    cp ./db/custom.db /app/db/custom.db
    echo "Copied existing database file"
else
    echo "No existing database file found, will create new one"
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push database schema
echo "Pushing database schema..."
npx prisma db push

# Always seed the database to ensure there's data
echo "Seeding database with initial data..."
npx tsx prisma/seed.ts

# Verify database was created and has data
echo "Verifying database..."
if [ -f "/app/db/custom.db" ]; then
    echo "Database file exists at /app/db/custom.db"
    ls -la /app/db/custom.db
else
    echo "ERROR: Database file was not created!"
    exit 1
fi

# Start the application
echo "Starting application..."
npm start