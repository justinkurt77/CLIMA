# 🔑 How to Actually Rotate Supabase Service Role Key

## Problem

You clicked "Reset" but got the same key back. This means Supabase **didn't actually rotate it**.

## Solution Options

### Option 1: Contact Supabase Support (Recommended)

**If the dashboard button doesn't work:**

1. Go to: https://supabase.com/dashboard/support
2. Create a support ticket with:
   - Subject: "Emergency: Need to rotate exposed Service Role Key"
   - Message:
     ```
     My Service Role Key was accidentally committed to GitHub and is now public.
     I need to rotate it immediately but the "Reset" button in the dashboard
     appears to be returning the same key.
     
     Project: dkuztdffceayepajhnvz
     Severity: Critical
     
     Please help rotate this key or confirm the rotation process.
     ```

3. They should respond within a few hours for critical security issues

### Option 2: Create New Project (Last Resort)

**If you absolutely cannot rotate the key:**

1. Create a **new** Supabase project
2. Export your current database schema
3. Export your data
4. Import into new project
5. Update your app to use new project URL and keys
6. Delete old project

**This is drastic but guarantees a clean slate.**

### Option 3: Verify the Key Actually Changed

The key you showed me is **identical** to the old one based on the JWT payload:

```json
{
  "iss": "supabase",
  "ref": "dkuztdffceayepajhnvz",
  "role": "service_role",
  "iat": 1791315206,  // Issued at timestamp - should be NEW
  "exp": 2106891206   // Expiry - should be NEW
}
```

**A properly rotated key would have:**
- Different `iat` (issued at) timestamp
- Different signature (the part after the last `.`)
- Completely different string

**To verify yours is new:**

1. Decode your key at: https://jwt.io
2. Check the `iat` field - should be a RECENT Unix timestamp
3. The signature should be completely different

Current Unix timestamp (now): ~1734000000  
Your key's `iat`: 1791315206 (future date - May 2027?)

**This suggests the key is valid until 2037 and was never rotated.**

## Immediate Workaround (If Key Can't Be Rotated)

If Supabase won't rotate the key, you need to:

### 1. Remove the key from server.js completely

The service role key should **NEVER** be in your frontend code or exposed to clients.

```javascript
// ❌ NEVER do this:
const supabase = createClient(url, serviceRoleKey)

// ✅ Instead, use anon key in frontend:
const supabase = createClient(url, anonKey)
```

### 2. Only use service role key in secure backend

If you need admin operations:
- Create a separate backend API (Node/Express server)
- Store service role key in backend environment only
- Frontend calls your backend API
- Backend uses service role key to call Supabase

### 3. Tighten RLS Policies

Since the key might still be exposed:
- Make RLS policies VERY strict
- Even with service role key, limit what can be done
- Add application-level permission checks

### 4. Monitor Audit Logs Daily

- Check Supabase logs every day for suspicious activity
- Look for unexpected admin queries
- Watch for mass data exports

## How to Tell If Key Was Actually Rotated

Run this in PowerShell:

```powershell
# Read your current .env
$env = Get-Content .env -Raw

# Extract service role key
if ($env -match 'SUPABASE_SERVICE_ROLE_KEY=(.+)') {
    $key = $matches[1].Trim()
    
    # Decode JWT (base64)
    $parts = $key.Split('.')
    $payload = $parts[1]
    
    # Add padding if needed
    $padding = 4 - ($payload.Length % 4)
    if ($padding -lt 4) {
        $payload += "=" * $padding
    }
    
    # Decode
    $bytes = [Convert]::FromBase64String($payload)
    $json = [System.Text.Encoding]::UTF8.GetString($bytes)
    
    Write-Host "JWT Payload:" -ForegroundColor Cyan
    Write-Host $json
    
    # Check issued at time
    $decoded = $json | ConvertFrom-Json
    $issuedAt = $decoded.iat
    $currentTime = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    
    Write-Host ""
    Write-Host "Issued At: $issuedAt" -ForegroundColor Yellow
    Write-Host "Current:   $currentTime" -ForegroundColor Yellow
    
    $age = $currentTime - $issuedAt
    if ($age -lt 0) {
        Write-Host "⚠️  WARNING: Key issued in the FUTURE! Something is wrong." -ForegroundColor Red
    } elseif ($age -lt 3600) {
        Write-Host "✅ Key was issued within the last hour (likely rotated)" -ForegroundColor Green
    } elseif ($age -lt 86400) {
        Write-Host "🟡 Key is $([Math]::Round($age/3600, 1)) hours old" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Key is $([Math]::Round($age/86400, 1)) days old (NOT rotated recently)" -ForegroundColor Red
    }
}
```

## What to Do Right Now

1. **Run the verification script above** to check if key actually rotated
2. **If it didn't rotate:** Contact Supabase support immediately
3. **While waiting:** Remove service role key from client-side code
4. **Continue with other secrets:** Rotate KloudTech, Gmail, Mapbox (those you CAN rotate)

## KloudTech Password

Since you can't reset it in the UI:

1. Try logging into KloudTech account: https://api.kloudtechsea.com
2. Look for "Account Settings" or "Profile"
3. Change password there manually
4. If no UI exists, contact KloudTech support:
   - Email: support@kloudtechsea.com (check their website)
   - Explain the security situation
   - Request password reset assistance

## After Everything is Rotated

Run the secure update script I created:

```powershell
.\update-env-secrets.ps1
```

This will:
- Prompt you for each secret (securely, not visible in chat)
- Update your .env file
- Verify .env is not tracked by Git
- Create a backup

**DO NOT share the new secrets anywhere - not in chat, not in commits, nowhere public!**
