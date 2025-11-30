# 🧹 PROJECT CLEANUP PLAN

## Overview
This document identifies all junk files, temporary files, and unnecessary artifacts that should be removed from the project.

---

## 📊 CLEANUP SUMMARY

**Total Junk Files Identified:** 93+  
**Estimated Space Savings:** ~50+ MB  
**Categories:**
- Temporary analysis files: 15
- Archive/backup files: 60+
- Duplicate configuration files: 3
- Test/debug scripts: 45+
- SQL debug files: 20+
- Miscellaneous: 5+

---

## 🗑️ FILES TO DELETE

### Category 1: Temporary RovoDev Analysis Files (15 files)
**Location:** Project root  
**Pattern:** `tmp_rovodev_*`

```
tmp_rovodev_admin_core_theme_analysis.md
tmp_rovodev_admin_ui_analysis.md
tmp_rovodev_booking_components_analysis.md
tmp_rovodev_booking_fixes_applied.md
tmp_rovodev_booking_issue_diagnosis.md
tmp_rovodev_check_design_elements.sh
tmp_rovodev_complete_project_analysis.md
tmp_rovodev_constants_backup.txt
tmp_rovodev_database_audit_report.md
tmp_rovodev_deploy_migration_manually.sql
tmp_rovodev_deployment_instructions.md
tmp_rovodev_extract_admin_colors.sh
tmp_rovodev_login_fix_summary.md
tmp_rovodev_test_bookings_schema.sql
tmp_rovodev_test_checklist.md
```

**Reason:** These are AI assistant working files that should not be committed to the repository.

---

### Category 2: Root-Level Debug/Test Files (8 files)
**Location:** Project root

```
cleanup_barber_metadata.sql
clear_storage.js
debug_constraint.sql
QUICK_FIX_CANCELED.sql
test-barber-photo.sql
verify_phase1.sql
Generated Image November 21, 2025 - 5_51AM (1).png (1.9 MB!)
constants.ts.removed.md (moved to archive but referenced)
```

**Reason:** These are development/debugging artifacts not needed in production codebase.

---

### Category 3: Duplicate Configuration Files (2 files)
**Location:** Project root

```
tailwind.config.js (duplicate of tailwind.config.cjs)
postcss.config.cjs (check if needed vs package.json config)
```

**Reason:** Multiple Tailwind configs cause confusion. Keep only one.

---

### Category 4: Archive Directory (60+ files)
**Location:** `./archive/`

#### Page Backups (7 files):
```
archive/adminDashboardpage.tsx
archive/AdminDashboardPageSimple.tsx
archive/EnhancedAdminDashboard.tsx
archive/ExcelRosterManager.tsx
archive/RosterManagement.tsx
archive/TestAdminPage.tsx
archive/page-backups/AdminDashboardPage.tsx.backup
archive/page-backups/AdminDashboardPage.tsx.corrupted
archive/page-backups/adminDashboardpage.tsx1
```

#### SQL Development Files (20 files):
```
archive/sql-development/apply-migrations.sql
archive/sql-development/barbers_schema.sql
archive/sql-development/check-products-table-structure.sql
archive/sql-development/check-products-table.sql
archive/sql-development/check_attendance_records.sql
archive/sql-development/check_barber_details.sql
archive/sql-development/check_barbers.sql
archive/sql-development/check_constraint.sql
archive/sql-development/check_existing_rosters.sql
archive/sql-development/check_role_sync.sql
archive/sql-development/check_roster_data.sql
archive/sql-development/check_roster_details.sql
archive/sql-development/check_roster_table.sql
archive/sql-development/check_rosters.sql
archive/sql-development/check_sync_status.sql
archive/sql-development/debug_roster_data.sql
archive/sql-development/fix_schema.sql
archive/sql-development/reload-schema.sql
archive/sql-development/supabase-schema.sql
archive/sql-development/test_attendance_constraint.sql
archive/sql-development/test_role_sync.sql
archive/sql-development/verify-imageurl-column.sql
archive/sql-development/verify-products-table-function.sql
archive/sql-development/verify-products-table.sql
archive/sql-development/verify_roster_schema.sql
```

#### Test Scripts (45 files):
```
archive/test-scripts/call-test-function.cjs
archive/test-scripts/check-products-table.js
archive/test-scripts/comprehensive-debug-test.js
archive/test-scripts/create_test_roster.ts
archive/test-scripts/debug-add-barber.js
archive/test-scripts/debug-add-product-flow.js
archive/test-scripts/debug-product-data.js
archive/test-scripts/deploy-settings-changes.js
archive/test-scripts/final-database-test.js
archive/test-scripts/final-test.js
archive/test-scripts/test-add-barber.js
archive/test-scripts/test-add-product-debug.js
archive/test-scripts/test-add-product.js
archive/test-scripts/test-admin-product-operations.js
archive/test-scripts/test-api-layer.js
archive/test-scripts/test-attendance.html
archive/test-scripts/test-auth-flow.js
archive/test-scripts/test-barber-creation.js
archive/test-scripts/test-barber-logic.js
archive/test-scripts/test-config.js
archive/test-scripts/test-db-connection.js
archive/test-scripts/test-duplicate-check.js
archive/test-scripts/test-image-upload.js
archive/test-scripts/test-product-fix.js
archive/test-scripts/test-products-direct.cjs
archive/test-scripts/test-products-structure.cjs
archive/test-scripts/test-products-table.js
archive/test-scripts/test-roster-functions.js
archive/test-scripts/test-tailwind.html
archive/test-scripts/test-update-barber.js
archive/test-scripts/test_attendance.js
archive/test-scripts/test_create_roster.js
archive/test-scripts/test_public_functions.js
archive/test-scripts/test_public_functions2.js
archive/test-scripts/test_public_functions3.js
archive/test-scripts/test_roster_function.js
archive/test-scripts/verify-roster-deployment.js
```

#### Archive Temp Files (5 files):
```
archive/tmp_rovodev_check_barber_profile.html
archive/tmp_rovodev_clean_sql.sql
archive/tmp_rovodev_debug_roster.html
archive/tmp_rovodev_simple_debug.js
archive/tmp_rovodev_test_barber_lookup.sql
archive/tmp_rovodev_user_setup.md
archive/constants.ts.removed.md
```

**Reason:** Archive directory contains old development artifacts. While archives can be useful for reference, these files are:
- No longer relevant to current codebase
- Available in git history if needed
- Taking up space and causing confusion

**Recommendation:** Delete entire `archive/` directory. If truly needed, create a separate git branch called `archive` or `historical-reference`.

---

### Category 5: Documentation Files to Review (Keep but Review)
**Location:** Project root

```
BOOKING_FIXES_SUMMARY.md (Keep - useful history)
MIGRATION_HELP.md (Keep - useful guide)
PR_DESCRIPTION.md (Keep - useful for PRs)
```

**Recommendation:** Keep these as they document important changes.

---

### Category 6: Supabase Temp Directory
**Location:** `supabase/.temp/`

```
supabase/.temp/cli-latest
supabase/.temp/gotrue-version
supabase/.temp/pooler-url
supabase/.temp/postgres-version
supabase/.temp/project-ref
supabase/.temp/rest-version
supabase/.temp/storage-migration
supabase/.temp/storage-version
```

**Reason:** These are auto-generated Supabase CLI files. Should be in `.gitignore`.

**Action:** Add to `.gitignore`, then delete from repo.

---

### Category 7: Empty/Placeholder Edge Functions
**Location:** `supabase/functions/`

```
supabase/functions/fix-product-orders-table/ (empty directory)
supabase/functions/test-attendance-constraint/ (empty directory)
supabase/functions/test-db-connection/ (likely not needed in production)
```

**Reason:** Empty directories and test functions should not be deployed.

---

## 🔧 CLEANUP SCRIPT

Run this script to clean up all junk files:

```bash
#!/bin/bash

echo "🧹 Starting LuxeCut Project Cleanup..."
echo ""

# Count files before cleanup
BEFORE_COUNT=$(find . -type f | wc -l)

# Remove tmp_rovodev files
echo "🗑️  Removing temporary RovoDev analysis files..."
rm -f tmp_rovodev_*.md
rm -f tmp_rovodev_*.sql
rm -f tmp_rovodev_*.sh
rm -f tmp_rovodev_*.txt

# Remove root-level debug files
echo "🗑️  Removing root-level debug files..."
rm -f cleanup_barber_metadata.sql
rm -f clear_storage.js
rm -f debug_constraint.sql
rm -f QUICK_FIX_CANCELED.sql
rm -f test-barber-photo.sql
rm -f verify_phase1.sql
rm -f "Generated Image November 21, 2025 - 5_51AM (1).png"

# Remove duplicate Tailwind config (keep .cjs version)
echo "🗑️  Removing duplicate config files..."
rm -f tailwind.config.js

# Remove entire archive directory
echo "🗑️  Removing archive directory..."
rm -rf archive/

# Remove Supabase temp files
echo "🗑️  Removing Supabase temp files..."
rm -rf supabase/.temp/

# Remove empty function directories
echo "🗑️  Removing empty function directories..."
rmdir supabase/functions/fix-product-orders-table/ 2>/dev/null
rmdir supabase/functions/test-attendance-constraint/ 2>/dev/null

# Count files after cleanup
AFTER_COUNT=$(find . -type f | wc -l)
REMOVED=$((BEFORE_COUNT - AFTER_COUNT))

echo ""
echo "✅ Cleanup complete!"
echo "📊 Files removed: $REMOVED"
echo "📁 Files remaining: $AFTER_COUNT"
echo ""
echo "⚠️  Remember to:"
echo "   1. Update .gitignore with recommended entries"
echo "   2. Commit the cleanup changes"
echo "   3. Run 'git gc' to reclaim disk space"
```

---

## 📝 RECOMMENDED .gitignore UPDATES

Add these entries to `.gitignore`:

```gitignore
# Environment files (CRITICAL SECURITY FIX)
.env
.env.local
.env.*.local

# Temporary files
tmp_*
temp_*
*.tmp
*.temp
*.backup
*.old

# Supabase temp files
supabase/.temp/
.supabase/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Build artifacts
dist/
build/
*.map

# Test files
*.test.js
*.spec.js
test-*.js
test-*.html

# SQL debug files
debug_*.sql
test_*.sql
check_*.sql
verify_*.sql
cleanup_*.sql

# Archive
archive/

# Logs
*.log
logs/
```

---

## 🎯 POST-CLEANUP ACTIONS

### 1. Update Git History (CRITICAL if .env was committed)
```bash
# Remove .env from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: Coordinate with team first!)
git push origin --force --all
git push origin --force --tags
```

### 2. Clean Local Git Repository
```bash
# Remove local refs
rm -rf .git/refs/original/

# Garbage collect and prune
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 3. Verify Cleanup
```bash
# Check file count
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l

# Check for any remaining tmp_ files
find . -name "tmp_*" -not -path "*/node_modules/*"

# Check for .env in git
git log --all --full-history -- .env .env.local
```

### 4. Update Documentation
- [ ] Update README.md with project structure
- [ ] Document environment variable setup
- [ ] Add security guidelines
- [ ] Update deployment instructions

---

## 📋 CLEANUP CHECKLIST

### Pre-Cleanup
- [ ] Backup project (just in case)
- [ ] Review SECURITY_AUDIT_REPORT.md
- [ ] Coordinate with team members
- [ ] Check if any files are still needed

### Cleanup Execution
- [ ] Run cleanup script
- [ ] Update .gitignore
- [ ] Remove .env files from git history (if needed)
- [ ] Clean git repository
- [ ] Verify cleanup results

### Post-Cleanup
- [ ] Test application still works
- [ ] Commit cleanup changes
- [ ] Push to repository
- [ ] Update project documentation
- [ ] Create .env.example file
- [ ] Notify team of changes

---

## ⚠️ WARNINGS

1. **DO NOT** delete files if you're unsure
2. **DO NOT** force push without team coordination
3. **DO** backup before running cleanup script
4. **DO** test application after cleanup
5. **DO** rotate API keys if .env was in git history

---

## 📊 EXPECTED RESULTS

After cleanup:
- **~93 fewer files**
- **~50+ MB disk space saved**
- **Cleaner project structure**
- **Faster git operations**
- **Reduced security risks**
- **Better maintainability**

---

## 🔍 MAINTENANCE PLAN

### Weekly
- Check for new tmp_ files
- Review and clean logs

### Monthly
- Audit dependencies for updates
- Review and clean test files
- Check for new junk files

### Quarterly
- Full security audit
- Dependency vulnerability scan
- Project structure review

---

**End of Cleanup Plan**
