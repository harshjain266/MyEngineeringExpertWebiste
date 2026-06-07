#!/bin/bash
echo "🚀 Starting database setup..."
npx prisma generate
npx prisma db push --accept-data-loss
npx prisma db seed
echo "✅ Database setup and seeding complete!"
