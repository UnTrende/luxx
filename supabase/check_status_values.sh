#!/bin/bash

# Script to check current status values in database
# Run this to see what values exist before migration

echo "=== Checking BOOKINGS status values ==="
echo "SELECT DISTINCT status, COUNT(*) FROM bookings GROUP BY status ORDER BY status;" | psql $DATABASE_URL

echo ""
echo "=== Checking PRODUCT_ORDERS status values ==="
echo "SELECT DISTINCT status, COUNT(*) FROM product_orders GROUP BY status ORDER BY status;" | psql $DATABASE_URL

echo ""
echo "=== Checking ATTENDANCE status values ==="
echo "SELECT DISTINCT status, COUNT(*) FROM attendance GROUP BY status ORDER BY status;" | psql $DATABASE_URL
