#!/bin/bash

# LuxeCut Project Cleanup Script
# This script removes all identified junk files and cleans up the project

set -e  # Exit on error

echo "🧹 ======================================"
echo "🧹 LUXECUT PROJECT CLEANUP SCRIPT"
echo "🧹 ======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Count files before cleanup
echo "📊 Analyzing project structure..."
BEFORE_COUNT=$(find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" | wc -l)
echo "📁 Files before cleanup: $BEFORE_COUNT"
echo ""

# Confirmation
echo -e "${YELLOW}⚠️  WARNING: This will delete 90+ files${NC}"
echo "Files to be deleted:"
echo "  - 15 tmp_rovodev_* files"
echo "  - 8 root debug files"
echo "  - 1 duplicate config file"
echo "  - 60+ archive files"
echo "  - Supabase .temp directory"
echo ""
read -p "Continue with cleanup? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting cleanup..."
echo ""

# Track deleted files
DELETED=0

# Function to safely delete file
delete_file() {
    if [ -f "$1" ]; then
        rm -f "$1"
        DELETED=$((DELETED + 1))
        echo "  ✓ Deleted: $1"
    fi
}

# Function to safely delete directory
delete_dir() {
    if [ -d "$1" ]; then
        FILE_COUNT=$(find "$1" -type f | wc -l)
        rm -rf "$1"
        DELETED=$((DELETED + FILE_COUNT))
        echo "  ✓ Deleted directory: $1 ($FILE_COUNT files)"
    fi
}

# 1. Remove tmp_rovodev files
echo "📝 [1/7] Removing temporary RovoDev analysis files..."
delete_file "tmp_rovodev_admin_core_theme_analysis.md"
delete_file "tmp_rovodev_admin_ui_analysis.md"
delete_file "tmp_rovodev_booking_components_analysis.md"
delete_file "tmp_rovodev_booking_fixes_applied.md"
delete_file "tmp_rovodev_booking_issue_diagnosis.md"
delete_file "tmp_rovodev_check_design_elements.sh"
delete_file "tmp_rovodev_complete_project_analysis.md"
delete_file "tmp_rovodev_constants_backup.txt"
delete_file "tmp_rovodev_database_audit_report.md"
delete_file "tmp_rovodev_deploy_migration_manually.sql"
delete_file "tmp_rovodev_deployment_instructions.md"
delete_file "tmp_rovodev_extract_admin_colors.sh"
delete_file "tmp_rovodev_login_fix_summary.md"
delete_file "tmp_rovodev_test_bookings_schema.sql"
delete_file "tmp_rovodev_test_checklist.md"
echo ""

# 2. Remove root-level debug files
echo "🐛 [2/7] Removing root-level debug files..."
delete_file "cleanup_barber_metadata.sql"
delete_file "clear_storage.js"
delete_file "debug_constraint.sql"
delete_file "QUICK_FIX_CANCELED.sql"
delete_file "test-barber-photo.sql"
delete_file "verify_phase1.sql"
delete_file "Generated Image November 21, 2025 - 5_51AM (1).png"
echo ""

# 3. Remove duplicate config file
echo "⚙️  [3/7] Removing duplicate configuration files..."
delete_file "tailwind.config.js"
echo ""

# 4. Remove archive directory
echo "📦 [4/7] Removing archive directory..."
delete_dir "archive"
echo ""

# 5. Remove Supabase temp files
echo "🗄️  [5/7] Removing Supabase temporary files..."
delete_dir "supabase/.temp"
echo ""

# 6. Remove empty function directories
echo "📂 [6/7] Cleaning up empty directories..."
if [ -d "supabase/functions/fix-product-orders-table" ]; then
    if [ -z "$(ls -A supabase/functions/fix-product-orders-table)" ]; then
        rmdir "supabase/functions/fix-product-orders-table"
        echo "  ✓ Removed empty: supabase/functions/fix-product-orders-table"
    fi
fi
if [ -d "supabase/functions/test-attendance-constraint" ]; then
    if [ -z "$(ls -A supabase/functions/test-attendance-constraint)" ]; then
        rmdir "supabase/functions/test-attendance-constraint"
        echo "  ✓ Removed empty: supabase/functions/test-attendance-constraint"
    fi
fi
echo ""

# 7. Update .gitignore
echo "📝 [7/7] Updating .gitignore..."
cat >> .gitignore << 'EOF'

# ============================================
# Security - Environment Files (CRITICAL)
# ============================================
.env
.env.local
.env.*.local
.env.production
.env.development

# ============================================
# Temporary Files
# ============================================
tmp_*
temp_*
*.tmp
*.temp
*.backup
*.old
*.bak

# ============================================
# Supabase
# ============================================
supabase/.temp/
.supabase/

# ============================================
# SQL Debug Files
# ============================================
debug_*.sql
test_*.sql
check_*.sql
verify_*.sql
cleanup_*.sql

# ============================================
# Archive & Backups
# ============================================
archive/
backups/

# ============================================
# Generated Files
# ============================================
*.png
*.jpg
*.jpeg
!public/*.png
!public/*.jpg
!public/*.jpeg
EOF
echo "  ✓ Added security and cleanup patterns to .gitignore"
echo ""

# Count files after cleanup
AFTER_COUNT=$(find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" | wc -l)

echo "🎉 ======================================"
echo "🎉 CLEANUP COMPLETE!"
echo "🎉 ======================================"
echo ""
echo "📊 Results:"
echo "  Files before:  $BEFORE_COUNT"
echo "  Files after:   $AFTER_COUNT"
echo "  Files removed: $DELETED"
echo ""
echo -e "${GREEN}✅ Project is now clean!${NC}"
echo ""
echo "⚠️  NEXT STEPS (CRITICAL):"
echo "  1. Review changes: git status"
echo "  2. Test application: npm run dev"
echo "  3. Check .env is NOT tracked: git ls-files | grep .env"
echo "  4. If .env is tracked, run: git rm --cached .env .env.local"
echo "  5. Commit cleanup: git add -A && git commit -m 'chore: cleanup junk files'"
echo "  6. ROTATE ALL KEYS if .env was ever in git history!"
echo ""
echo "📖 For security fixes, see: SECURITY_AUDIT_REPORT.md"
echo ""
