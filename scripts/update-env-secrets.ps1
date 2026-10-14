# Secure Environment Variable Update Script
# Run this to update your .env file without exposing secrets

Write-Host "🔐 CLIMA Secret Rotation Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    exit 1
}

# Backup existing .env
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item ".env" ".env.backup.$timestamp"
Write-Host "✅ Backed up .env to .env.backup.$timestamp" -ForegroundColor Green

Write-Host ""
Write-Host "⚠️  SECURITY NOTICE:" -ForegroundColor Yellow
Write-Host "   - DO NOT share these values in chat or commit them to Git" -ForegroundColor Yellow
Write-Host "   - Type or paste values directly into this terminal only" -ForegroundColor Yellow
Write-Host ""

# Function to securely read input
function Read-SecureValue {
    param([string]$Prompt, [string]$CurrentValue = "")
    
    Write-Host "$Prompt" -ForegroundColor Cyan
    if ($CurrentValue) {
        Write-Host "  Current (first 20 chars): $($CurrentValue.Substring(0, [Math]::Min(20, $CurrentValue.Length)))..." -ForegroundColor DarkGray
    }
    Write-Host "  New value (or press Enter to keep current): " -NoNewline -ForegroundColor White
    
    $newValue = Read-Host
    
    if ([string]::IsNullOrWhiteSpace($newValue)) {
        return $CurrentValue
    }
    return $newValue.Trim()
}

# Read current .env
$envContent = Get-Content ".env" -Raw

# Extract current values using regex
$currentSupabaseKey = if ($envContent -match 'SUPABASE_SERVICE_ROLE_KEY=(.+)') { $matches[1].Trim() } else { "" }
$currentKloudToken = if ($envContent -match 'VITE_KLOUDTECH_TOKEN=(.+)') { $matches[1].Trim() } else { "" }
$currentKloudPassword = if ($envContent -match 'VITE_KLOUDTECH_PASSWORD=(.+)') { $matches[1].Trim() } else { "" }
$currentSmtpPass = if ($envContent -match 'SMTP_PASS=(.+)') { $matches[1].Trim() } else { "" }
$currentMapboxToken = if ($envContent -match 'VITE_MAPBOX_TOKEN=(.+)') { $matches[1].Trim() } else { "" }

Write-Host ""
Write-Host "📝 Update the following secrets:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Collect new values
$newSupabaseKey = Read-SecureValue "1️⃣  Supabase Service Role Key (CRITICAL)" $currentSupabaseKey
$newKloudToken = Read-SecureValue "2️⃣  KloudTech API Token" $currentKloudToken
$newKloudPassword = Read-SecureValue "3️⃣  KloudTech Password" $currentKloudPassword
$newSmtpPass = Read-SecureValue "4️⃣  Gmail SMTP App Password" $currentSmtpPass
$newMapboxToken = Read-SecureValue "5️⃣  Mapbox Token" $currentMapboxToken

# Verify Supabase key actually changed
if ($newSupabaseKey -eq $currentSupabaseKey) {
    Write-Host ""
    Write-Host "⚠️  WARNING: Supabase Service Role Key appears unchanged!" -ForegroundColor Yellow
    Write-Host "   The key might not have been rotated properly in Supabase." -ForegroundColor Yellow
    Write-Host "   Please verify in Supabase Dashboard > Settings > API" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "❌ Aborted. Please rotate the key first." -ForegroundColor Red
        exit 1
    }
}

# Update .env content
$envContent = $envContent -replace 'SUPABASE_SERVICE_ROLE_KEY=.+', "SUPABASE_SERVICE_ROLE_KEY=$newSupabaseKey"
$envContent = $envContent -replace 'VITE_KLOUDTECH_TOKEN=.+', "VITE_KLOUDTECH_TOKEN=$newKloudToken"
$envContent = $envContent -replace 'VITE_KLOUDTECH_PASSWORD=.+', "VITE_KLOUDTECH_PASSWORD=$newKloudPassword"
$envContent = $envContent -replace 'SMTP_PASS=.+', "SMTP_PASS=$newSmtpPass"
$envContent = $envContent -replace 'VITE_MAPBOX_TOKEN=.+', "VITE_MAPBOX_TOKEN=$newMapboxToken"

# Write updated .env
$envContent | Set-Content ".env" -NoNewline

Write-Host ""
Write-Host "✅ Successfully updated .env file!" -ForegroundColor Green
Write-Host ""

# Verify .env is not tracked by git
$gitTracked = git ls-files .env 2>$null
if ($gitTracked) {
    Write-Host "❌ ERROR: .env is still tracked by Git!" -ForegroundColor Red
    Write-Host "   Running: git rm --cached .env" -ForegroundColor Yellow
    git rm --cached .env
    Write-Host "   ✅ Removed from Git tracking" -ForegroundColor Green
    Write-Host ""
    Write-Host "   ⚠️  You must commit this change:" -ForegroundColor Yellow
    Write-Host "   git commit -m 'security: Remove .env from Git tracking'" -ForegroundColor White
    Write-Host "   git push origin main" -ForegroundColor White
} else {
    Write-Host "✅ .env is not tracked by Git (good!)" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test your application with the new secrets" -ForegroundColor White
Write-Host "  2. Update production environment variables (Vercel/Netlify)" -ForegroundColor White
Write-Host "  3. Review Supabase audit logs for suspicious activity" -ForegroundColor White
Write-Host "  4. Delete backup file when confirmed working: .env.backup.$timestamp" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Security Reminder:" -ForegroundColor Yellow
Write-Host "   - Never commit .env to Git" -ForegroundColor Yellow
Write-Host "   - Never share secrets in chat/email" -ForegroundColor Yellow
Write-Host "   - Rotate secrets every 90 days" -ForegroundColor Yellow
Write-Host ""
