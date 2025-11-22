#!/bin/bash
# Database initialization script for Railway

echo "🔄 Running database migration..."
npx prisma db push --accept-data-loss

echo "✅ Database initialized!"
