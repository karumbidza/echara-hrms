#!/bin/sh
set -e

echo "🔄 Initializing database..."
echo "DATABASE_URL is set: $(if [ -n "$DATABASE_URL" ]; then echo "YES"; else echo "NO"; fi)"

# Run database migrations
echo "Running Prisma DB Push..."
if npx prisma db push --skip-generate --accept-data-loss; then
    echo "✅ Database migrations completed successfully!"
else
    echo "❌ Database migration failed!"
    echo "Error details:"
    npx prisma db push --skip-generate --accept-data-loss 2>&1 || true
    exit 1
fi

echo "✅ Database ready!"
echo "🚀 Starting server..."
exec node dist/app.js
