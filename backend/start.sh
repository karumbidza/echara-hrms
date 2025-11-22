#!/bin/sh
echo "🔄 Initializing database..."
npx prisma db push --skip-generate --accept-data-loss
echo "✅ Database ready!"
echo "🚀 Starting server..."
exec node dist/app.js
