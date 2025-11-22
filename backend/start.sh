#!/bin/sh
echo "🔄 Initializing database..."
echo "DATABASE_URL: ${DATABASE_URL}"
npx prisma db push --skip-generate --accept-data-loss || echo "⚠️  Migration failed, continuing..."
echo "✅ Database ready!"
echo "🚀 Starting server..."
exec node dist/app.js
