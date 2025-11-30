# ⚡ QUICK START GUIDE - Critical Actions

**READ THIS FIRST!** This guide contains the most critical actions you need to take immediately.

---

## 🚨 CRITICAL: FIX .ENV EXPOSURE (DO THIS NOW!)

Your `.env` file is currently tracked in git. This is a **CRITICAL SECURITY ISSUE**.

### Step 1: Check if .env was committed to git history
```bash
git log --all --full-history -- .env .env.local
```

**If you see commits:** Your secrets have been exposed in git history!

### Step 2: Remove .env from git (if currently staged)
```bash
# Remove from git tracking
git rm --cached .env .env.local

# Verify they're removed
git status

# Commit the change
git add .gitignore
git commit -m "security: remove .env files from git tracking"
```

### Step 3: If .env was in git history - ROTATE ALL KEYS
If Step 1 showed any commits, your keys are compromised. You MUST:

1. **Go to Supabase Dashboard:** https://app.supabase.com
2. **Project Settings → API**
3. **Reset/Rotate ALL Keys:**
   - Service Role Key (most critical)
   - Anon Key (public, but rotate anyway)
4. **Update your local .env** with new keys
5. **Notify your team** to update their .env files

### Step 4: Clean git history (if .env was committed)
```bash
# WARNING: This rewrites git history. Coordinate with team first!
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: Team must re-clone or fetch)
git push origin --force --all
```

### Step 5: Verify .env is not tracked
```bash
# Should return empty
git ls-files | grep .env

# Should show .env as untracked
git status
```

---

## 🔒 CRITICAL SECURITY FIXES (Next 24 Hours)

### Fix 1: Add Authentication to Edge Functions

**Vulnerable functions that need authentication:**
- `get-all-users`
- `get-all-bookings`
- `get-all-orders`
- `update-user-role`
- `delete-barber`
- `delete-product`
- `delete-service`
- And 13 more...

**Example Fix:**
```typescript
// supabase/functions/get-all-users/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateAdmin } from '../_shared/auth.ts';  // ADD THIS
import { supabaseAdmin } from '../_shared/supabaseClient.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ADD AUTHENTICATION CHECK
    const user = await authenticateAdmin(req);
    // Now only admins can proceed
    
    const { data: users, error } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .order('name');

    if (error) throw error;

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,  // Unauthorized
    });
  }
});
```

**Apply this pattern to all 20+ vulnerable functions.**

### Fix 2: Move Gemini API Key to Backend

**Current (INSECURE):**
```typescript
// vite.config.ts - REMOVE THIS
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
}
```

**New (SECURE):**
1. Create `supabase/functions/generate-hairstyle/index.ts`
2. Move API key to Supabase secrets
3. Frontend calls Edge Function instead of Gemini directly

```typescript
// supabase/functions/generate-hairstyle/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { GoogleGenAI } from "npm:@google/genai";

serve(async (req) => {
  try {
    const { prompt, imageBase64 } = await req.json();
    
    // API key is secure on backend
    const ai = new GoogleGenAI({ 
      apiKey: Deno.env.get('GEMINI_API_KEY') 
    });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [
        { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
        { text: `Edit hairstyle to be ${prompt}` }
      ]},
      config: { responseModalities: ['IMAGE'] }
    });
    
    // Return result
    return new Response(JSON.stringify({ 
      image: response.candidates[0].content.parts[0].inlineData.data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

---

## 🧹 CLEANUP PROJECT (This Week)

### Option 1: Automated (Recommended)
```bash
# Run the cleanup script
./cleanup_project.sh

# Follow prompts
# Script will:
# - Remove all tmp_rovodev_* files
# - Remove debug files
# - Remove archive directory
# - Clean supabase/.temp/
# - Update .gitignore
```

### Option 2: Manual Cleanup
If you want to review files before deleting:

```bash
# Review what will be deleted
ls tmp_rovodev_*
ls archive/

# Delete specific categories
rm tmp_rovodev_*.md
rm tmp_rovodev_*.sql
rm tmp_rovodev_*.sh

# Or keep archive for now and clean later
# (it can be deleted anytime)
```

### After Cleanup
```bash
# Test application
npm run dev

# If everything works, commit
git add -A
git commit -m "chore: cleanup temporary and archive files"
git push
```

---

## 📚 DOCUMENTATION OVERVIEW

### 1. **FINAL_SUMMARY.md** ⭐ START HERE
- Executive summary of everything
- Critical actions checklist
- Project statistics
- Next steps

### 2. **SECURITY_AUDIT_REPORT.md** 🔒 CRITICAL READING
- 22 security issues identified
- 3 critical, 8 high, 6 medium, 5 low
- Detailed remediation with code examples
- CVSS scores and attack vectors

### 3. **PROJECT_OVERVIEW.md** 📖 REFERENCE
- Complete project documentation
- Architecture overview
- All 40+ Edge Functions documented
- Database schema
- Feature list

### 4. **CLEANUP_PLAN.md** 🧹 ACTION PLAN
- List of 93+ junk files
- Categories and reasons for deletion
- Cleanup strategies
- Post-cleanup actions

### 5. **cleanup_project.sh** 🤖 AUTOMATION
- Automated cleanup script
- Interactive prompts
- Safe deletion with confirmation
- Progress tracking

### 6. **.env.example** ⚙️ TEMPLATE
- Environment variable template
- Copy to .env and fill in values
- Documentation for each variable

---

## ✅ DAILY CHECKLIST (First Week)

### Day 1 (TODAY) - Critical Security
- [ ] Verify .env not in git: `git ls-files | grep .env`
- [ ] Check git history: `git log --all -- .env`
- [ ] Rotate keys if needed
- [ ] Read SECURITY_AUDIT_REPORT.md completely
- [ ] Plan security fixes with team

### Day 2 - Authentication
- [ ] Add auth to `get-all-users`
- [ ] Add auth to `get-all-bookings`
- [ ] Add auth to `get-all-orders`
- [ ] Add auth to `update-user-role`
- [ ] Test all changes

### Day 3 - Authentication (continued)
- [ ] Add auth to delete functions
- [ ] Add auth to remaining admin functions
- [ ] Test thoroughly
- [ ] Deploy to staging

### Day 4 - API Security
- [ ] Create `generate-hairstyle` Edge Function
- [ ] Move Gemini API key to Supabase secrets
- [ ] Update frontend to call Edge Function
- [ ] Test AI features

### Day 5 - Cleanup & Testing
- [ ] Run cleanup script
- [ ] Test entire application
- [ ] Fix any issues found
- [ ] Update documentation
- [ ] Deploy to production

---

## 🔍 QUICK VERIFICATION COMMANDS

```bash
# Check if .env is tracked
git ls-files | grep .env
# Should be empty

# Check git status
git status
# .env should be untracked

# Count files
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l

# Check for tmp files
find . -name "tmp_*" -not -path "*/node_modules/*"

# Test application
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🆘 TROUBLESHOOTING

### Issue: .env still tracked after git rm --cached
```bash
# Force remove
git rm -f --cached .env .env.local

# Check again
git status
```

### Issue: Cleanup script permission denied
```bash
chmod +x cleanup_project.sh
./cleanup_project.sh
```

### Issue: Application won't start after cleanup
```bash
# Check if you accidentally deleted something important
git status
git diff

# Restore if needed
git checkout -- <filename>
```

### Issue: Supabase functions not deploying
```bash
# Check Supabase CLI
supabase --version

# Login to Supabase
supabase login

# Deploy functions
supabase functions deploy
```

---

## 📞 NEED HELP?

### Review Order:
1. **FINAL_SUMMARY.md** - Overview and next steps
2. **This file** - Quick commands and critical actions
3. **SECURITY_AUDIT_REPORT.md** - Detailed security analysis
4. **PROJECT_OVERVIEW.md** - Technical reference

### Key Resources:
- Supabase Docs: https://supabase.com/docs
- Supabase Dashboard: https://app.supabase.com
- Edge Functions Guide: https://supabase.com/docs/guides/functions

---

## 🎯 SUCCESS CRITERIA

### Week 1 Complete When:
- ✅ .env removed from git
- ✅ Keys rotated (if necessary)
- ✅ Authentication added to all admin functions
- ✅ Gemini API moved to backend
- ✅ Cleanup script run
- ✅ Application tested and working
- ✅ Changes committed and deployed

### Month 1 Complete When:
- ✅ All 22 security issues addressed
- ✅ Rate limiting implemented
- ✅ Input validation added
- ✅ Audit logging in place
- ✅ Team trained on security practices

---

**Remember:** Security is not optional. Fix the critical issues today!

🚀 Good luck! You've got this!
