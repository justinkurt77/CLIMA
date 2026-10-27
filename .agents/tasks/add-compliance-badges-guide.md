# How to Add Compliance Badges to CLIMA

## Step 1: Save the Images

You need to save the three images you provided to the correct location:

### Image 1: NPC DPO/DPS Registration Badge
- **File name:** `npc-dpo-dps-badge.png`
- **Location:** `public/images/legal/npc-dpo-dps-badge.png`
- **Description:** National Privacy Commission badge showing DPO/DPS registration valid until June 23, 2027

### Image 2: ICT Division Logo
- **File name:** `ict-division-logo.png`
- **Location:** `public/images/legal/ict-division-logo.png`
- **Description:** Palayan City ICT Division logo with brain network design in blue, red, and yellow

### Image 3: Palayan City Seal
- **File name:** `palayan-city-seal.png`
- **Location:** `public/images/legal/palayan-city-seal.png`
- **Description:** Official city seal "Lungsod ng Palayan - Kabisera ng Nueva Ecija - 1965"

---

## How to Save (Windows)

### Option 1: From Chat Images
1. Right-click each image in the chat
2. Select "Save image as..."
3. Navigate to `C:\Users\User\CLIMA\public\images\legal\`
4. Save with the exact file names listed above

### Option 2: If Images Are Already Downloaded
If you already downloaded them to your Downloads folder:

```powershell
# Run these commands in PowerShell from the CLIMA directory
Move-Item "C:\Users\User\Downloads\<original-name-1>.png" "public/images/legal/npc-dpo-dps-badge.png"
Move-Item "C:\Users\User\Downloads\<original-name-2>.png" "public/images/legal/ict-division-logo.png"
Move-Item "C:\Users\User\Downloads\<original-name-3>.png" "public/images/legal/palayan-city-seal.png"
```

---

## Step 2: Verify the Files

Run this command to verify all images are in place:

```powershell
Get-ChildItem "public/images/legal" | Select-Object Name, Length
```

You should see:
```
Name                        Length
----                        ------
ict-division-logo.png       [file size]
npc-dpo-dps-badge.png       [file size]
palayan-city-seal.png       [file size]
```

---

## Step 3: Test in Browser

1. Start the dev server: `npm run dev`
2. Navigate to the Legal tab in the app
3. Click on "Privacy Policy"
4. You should see three badges at the top:
   - NPC Registration Badge (keyhole shape)
   - ICT Division Logo (brain network)
   - Palayan City Seal (green circular seal)

---

## What Was Changed

### File: `src/screens/LegalScreen.jsx`

**Added:**
- `ComplianceBadges()` component that displays the three images
- Grid layout for responsive badge display
- Tagline: "Datos ng Pilipino, Protektado Ko!"
- Registration validity note: "Valid until June 23, 2027"
- Badges only show on Privacy Policy tab (not other legal docs)

**Features:**
- Responsive grid (adapts to mobile/desktop)
- Professional card styling with subtle shadows
- Labels under each badge
- Blue info box with Data Privacy Act compliance statement

---

## Expected Result

When users view the Privacy Policy, they will see:

```
┌─────────────────────────────────────────────────────────┐
│         Data Protection Compliance                       │
├─────────────────────────────────────────────────────────┤
│  [NPC Badge]      [ICT Logo]      [City Seal]           │
│  NPC Registered   ICT Division    Official Seal         │
│  Valid: 6/23/27   Palayan City    City Government       │
├─────────────────────────────────────────────────────────┤
│ ℹ️ Datos ng Pilipino, Protektado Ko! - The City        │
│   Government of Palayan is officially registered...      │
└─────────────────────────────────────────────────────────┘
```

Followed by the full Privacy Policy text.

---

## Next Steps After Adding Images

1. ✅ Build the project: `npm run build`
2. ✅ Test on mobile viewport (Chrome DevTools)
3. ✅ Verify all three images load correctly
4. ✅ Check that badges only appear on Privacy Policy tab
5. ✅ Commit changes:

```bash
git add public/images/legal/
git add src/screens/LegalScreen.jsx
git commit -m "feat: add NPC DPO/DPS compliance badges to Privacy Policy"
git push origin main
```

---

## Troubleshooting

### Images Don't Show
- Check file names match exactly (case-sensitive on some systems)
- Verify images are in `public/images/legal/` not `src/images/legal/`
- Check browser console for 404 errors
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Layout Looks Wrong
- Check viewport width (badges stack vertically on mobile < 640px)
- Ensure images are PNG format (transparent backgrounds work best)
- Verify images are reasonable size (recommended: 500x500px or similar)

### Badge Shows on Wrong Tab
- Should only appear on Privacy Policy tab
- Check `{activeTab === "privacy" && <ComplianceBadges />}` condition
- Verify state management in LegalScreen component

---

## Why This Matters

**Legal Compliance:**
- Demonstrates transparent data protection practices
- Shows official NPC registration (required under RA 10173)
- Builds public trust through government accountability

**User Confidence:**
- Visual proof of data privacy compliance
- Official government seals and logos
- Professional presentation of legal documents

**Production Readiness:**
- Meets government transparency requirements
- Aligns with National Privacy Commission standards
- Shows commitment to "Datos ng Pilipino, Protektado Ko!" campaign

---

**Status:** Ready to implement once images are saved to correct location.
