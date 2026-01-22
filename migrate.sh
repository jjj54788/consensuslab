#!/bin/bash
echo "Step 1: Create database (if needed)..."
mysql -u root -p < setup-db.sql

echo ""
echo "Step 2: Running database migrations..."
npm run db:push

echo ""
echo "Step 3: Seeding model providers..."
npx tsx scripts/seed-models.mjs

echo ""
echo "Done! Database is ready."
