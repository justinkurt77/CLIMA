# 🚨 SECURITY EMERGENCY REMEDIATION PLAN

**GitGuardian Alert:** Supabase Service Role JWT exposed in GitHub repository  
**Date:** October 13, 2026  
**Severity:** CRITICAL  
**Status:** IMMEDIATE ACTION REQUIRED

---

## 🔴 EXPOSED SECRETS (From .env file in Git history)

1. **Supabase Service Role Key** ⚠️ CRITICAL
   - Grants FULL ADMIN access to database
   - Can bypass RLS policies
   - Can read/write/delete ALL data
   - **Action:** MUST rotate immediately

2. **KloudTech API Token** ⚠️ HIGH
   - API access token
   - **Action:** Revoke and regenerate

3. **KloudTech Password** ⚠️ HIGH
   - User account password
   - **Action:** Change password

4. **Gmail SMTP Password** ⚠️ MEDIUM
   - Email sending credentials
   - **Action:** Regenerate app password

5. **Mapbox Token** ⚠️ LOW
   - Map API access
   - **Action:** Rotate token (rate limit protection)

---

## ✅ IMMEDIATE ACTIONS (Do these RIGHT NOW - in order)

### Step 1: Rotate Supabase Service Role Key (CRITICAL)

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/dkuztdffceayepajhnvz

2. **Navigate to:** Settings > API

3. **Click "Reset Service Role Key"**
   - This will invalidate the exposed key immediately
   - Copy the NEW service role key

4. **Update local .env file** with new key:
   ```
   SUPABASE_SERVICE_ROLE_KEY=<new_key_here>
   ```

5. **Update production environment variables:**
   - If deployed on Vercel/Netlify/etc., update env vars there
   - DO NOT commit the new key to Git

**Time Critical:** Do this FIRST before anything else!

---

### Step 2: Reset KloudTech Credentials

1. **Login to KloudTech:**
   - https://api.kloudtechsea.com

2. **Regenerate API Token**

3. **Change Account Password** for:
   - Email: feliciano.ramos@cityofpalayan.gov.ph
   - Old: ICTPalayan123! (EXPOSED)
   - New: <strong_password>

4. **Update local .env:**
   ```
   VITE_KLOUDTECH_TOKEN=<new_token>
   VITE_KLOUDTECH_PASSWORD=<new_password>
   ```

---

### Step 3: Reset Gmail SMTP Password

1. **Go to:** https://myaccount.google.com/apppasswords

2. **Revoke** existing app password: "lpku yfnn dtbd uhwx"

3. **Generate NEW** app password

4. **Update local .env:**
   ```
   SMTP_PASS=<new_app_password>
   ```

---

### Step 4: Rotate Mapbox Token

1. **Go to:** https://account.mapbox.com/access-tokens/

2. **Revoke** token: pk.eyJ1Ijoiamt6enp6eiIsImEiOiJjbXV4aDJtdTYwOGV1MnhvaHVieHZiYzhuIn0.VnU9DadZCnEInK9-ws_n2Q

3. **Create NEW** public token

4. **Update local .env:**
   ```
   VITE_MAPBOX_TOKEN=<new_token>
   ```

---

### Step 5: Remove .env from Git History (Nuclear Option)

**Option A: Use BFG Repo-Cleaner (Recommended)**

```powershell
# Install BFG
choco install bfg

# Clone a fresh copy
git clone --mirror https://github.com/justinkurt77/CLIMA.git CLIMA-mirror.git
cd CLIMA-mirror.git

# Remove .env from history
bfg --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (DESTRUCTIVE - coordinate with team!)
git push --force
```

**Option B: Keep History, Document the Breach**

If you can't force push (other collaborators), document that all secrets were rotated and the exposed keys are now invalid.

---

### Step 6: Verify .env is Ignored

```powershell
# Check .gitignore
cat .gitignore | Select-String ".env"

# Verify .env is not tracked
git ls-files | Select-String ".env"

# Should return nothing
```

---

### Step 7: Create .env.example (Template)

Create `c:\Users\User\CLIMA\.env.example`:

```
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Mapbox Configuration
VITE_MAPBOX_TOKEN=pk.your_token_here

# KloudTech SEA IoT API Configuration
VITE_KLOUDTECH_API_BASE=https://api.kloudtechsea.com/api/v1
VITE_KLOUDTECH_TOKEN=kloud_live_your_token_here
VITE_KLOUDTECH_EMAIL=your_email@cityofpalayan.gov.ph
VITE_KLOUDTECH_PASSWORD=your_password_here

# Backend API
PORT=3001
VITE_APP_URL=http://localhost:5173

# SMTP Configuration
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# Supabase Service Role Key (NEVER expose to client!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Commit this file (it's safe - no real secrets).

---

## 🛡️ PREVENTIVE MEASURES (Do after rotating secrets)

### 1. Add Pre-commit Hook to Block Secrets

Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh
if git diff --cached --name-only | grep -q ".env$"; then
    echo "🚨 ERROR: Attempting to commit .env file!"
    echo "This file contains secrets and should NEVER be committed."
    exit 1
fi

# Check for potential secrets in staged files
if git diff --cached | grep -qE "(SUPABASE_SERVICE_ROLE_KEY|SMTP_PASS|_PASSWORD|_SECRET)"; then
    echo "⚠️  WARNING: Potential secret detected in staged changes!"
    echo "Review your changes before committing."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
```

Make it executable:
```powershell
chmod +x .git/hooks/pre-commit
```

### 2. Enable GitGuardian Monitoring

- Already detected the breach (good!)
- Keep it enabled
- Monitor for future exposures

### 3. Use Environment Variable Management Service

For production, use:
- **Vercel/Netlify:** Built-in encrypted env vars
- **GitHub Secrets:** For CI/CD
- **Azure Key Vault / AWS Secrets Manager:** For enterprise

### 4. Rotate Secrets Regularly

- Service role keys: Every 90 days
- API tokens: Every 180 days
- Passwords: Every 90 days

### 5. Audit Access Logs

Check Supabase logs for any suspicious activity since the key was exposed:
- Unexpected admin queries
- Data exports
- RLS policy changes

---

## 📋 VERIFICATION CHECKLIST

After completing all steps:

- [ ] Supabase service role key rotated
- [ ] Old service role key confirmed invalid
- [ ] KloudTech API token regenerated
- [ ] KloudTech password changed
- [ ] Gmail SMTP password regenerated
- [ ] Mapbox token rotated
- [ ] Local .env updated with ALL new secrets
- [ ] Production env vars updated (Vercel/Netlify/etc.)
- [ ] Application tested with new credentials
- [ ] .env confirmed NOT in `git ls-files`
- [ ] .env.example created and committed
- [ ] Pre-commit hook installed
- [ ] Git history cleaned (optional)
- [ ] Team notified of secret rotation
- [ ] Supabase audit logs reviewed
- [ ] No suspicious database activity detected

---

## ⏱️ TIME ESTIMATE

- **Step 1-4 (Rotate secrets):** 15-20 minutes ⚠️ DO NOW
- **Step 5 (Clean git history):** 10-15 minutes (optional)
- **Step 6-7 (Verification):** 5 minutes
- **Preventive measures:** 15 minutes

**Total:** ~45-60 minutes to complete full remediation

---

## 🚨 WHY THIS MATTERS

**With the exposed Service Role Key, an attacker could:**

1. ✅ Bypass ALL Row Level Security policies
2. ✅ Read ALL user data (emails, passwords, personal info)
3. ✅ Delete ALL database data
4. ✅ Modify admin permissions
5. ✅ Create/delete users
6. ✅ Change database schema
7. ✅ Export entire database
8. ✅ Inject malicious data

**This is a COMPLETE database compromise scenario.**

---

## 📞 INCIDENT RESPONSE CONTACTS

- **Supabase Support:** https://supabase.com/dashboard/support
- **Repository Owner:** justinkurt77
- **Security Lead:** (Add contact info)

---

## 📝 POST-INCIDENT REPORT

After remediation, document:

1. **Timeline:**
   - When was .env first committed? (Check git log)
   - When was exposure detected? (October 13, 2026 per GitGuardian)
   - When were secrets rotated?

2. **Impact Assessment:**
   - Was database accessed by unauthorized parties?
   - Were any malicious actions taken?
   - What data was potentially exposed?

3. **Lessons Learned:**
   - How did .env get committed despite being in .gitignore?
   - What process changes prevent recurrence?

4. **Actions Taken:**
   - All secrets rotated
   - Git history cleaned (if applicable)
   - Pre-commit hooks installed
   - Team trained on secret management

---

**PRIORITY:** Drop everything and do Steps 1-4 RIGHT NOW. The database is currently at risk.

---

**Last Updated:** October 13, 2026  
**Next Review:** After all secrets rotated + 24 hours
