# CLIMA Compliance Badges Verification Script
# Checks if NPC, ICT, and City Seal images are properly saved

Write-Host "`n=== CLIMA Compliance Badges Verification ===" -ForegroundColor Cyan
Write-Host ""

$badgeDir = "public\images\legal"
$badges = @(
    @{Name="NPC DPO/DPS Badge"; File="npc-dpo-dps-badge.png"},
    @{Name="ICT Division Logo"; File="ict-division-logo.png"},
    @{Name="Palayan City Seal"; File="palayan-city-seal.png"}
)

$allPresent = $true

foreach ($badge in $badges) {
    $path = Join-Path $badgeDir $badge.File
    $exists = Test-Path $path
    
    if ($exists) {
        $file = Get-Item $path
        $sizeKB = [math]::Round($file.Length / 1KB, 2)
        Write-Host "[OK] " -ForegroundColor Green -NoNewline
        Write-Host "$($badge.Name): " -NoNewline
        Write-Host "$sizeKB KB" -ForegroundColor Yellow
    } else {
        Write-Host "[MISSING] " -ForegroundColor Red -NoNewline
        Write-Host "$($badge.Name)" -ForegroundColor White
        $allPresent = $false
    }
}

Write-Host ""

if ($allPresent) {
    Write-Host "SUCCESS: All badges are in place!" -ForegroundColor Green
    Write-Host "You can now run: " -NoNewline
    Write-Host "npm run dev" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "ACTION REQUIRED: Save missing images to:" -ForegroundColor Yellow
    Write-Host "$badgeDir\" -ForegroundColor White
    Write-Host ""
    Write-Host "See guide: .agents\tasks\add-compliance-badges-guide.md" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
