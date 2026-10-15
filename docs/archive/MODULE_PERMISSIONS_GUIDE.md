# Module Permissions - User Guide

## For Super Admins Only

### Accessing Module Permissions
1. Log in as Super Admin
2. Navigate to **Settings** tab in Admin Dashboard
3. **Module Permissions** section appears at the top (before Offices and Categories)

---

## Quick Role Templates

### Step 1: Select Admin User
Use the dropdown to select which admin user you want to assign permissions to:
```
[Select admin user first...               ▼]
```

### Step 2: Apply Template
Once user is selected, click any template button:

```
⚡ QUICK ROLE TEMPLATES

[Select admin user first...               ▼]

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Agriculture Admin│ │    CDRRMO Admin  │ │     BFP Admin    │
└──────────────────┘ └──────────────────┘ └──────────────────┘

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Hospital Admin  │ │   Water Admin    │ │    Power Admin   │
└──────────────────┘ └──────────────────┘ └──────────────────┘

┌──────────────────┐ ┌──────────────────────────────────────┐
│ Reports Manager  │ │      Full Module Access              │
└──────────────────┘ └──────────────────────────────────────┘
```

**What each template does:**
- **Agriculture Admin**: Dashboard + Agriculture modules
- **CDRRMO Admin**: Dashboard + CDRRMO modules
- **BFP Admin**: Dashboard + BFP modules
- **Hospital Admin**: Dashboard + Hospital modules
- **Water Admin**: Dashboard + Water modules
- **Power Admin**: Dashboard + Power modules
- **Reports Manager**: Dashboard + Reports + Advisories modules
- **Full Module Access**: All 12 modules

All templates grant **full CRUD permissions** (View, Create, Edit, Delete)

---

## Manual Permission Assignment

### Admin User List
Each admin user shows:

```
┌────────────────────────────────────────────────────────────┐
│ ▼  Juan dela Cruz                            ┌──────────┐  │
│    juan.delacruz@palayan.gov.ph              │ 3 Modules│  │
│                                              └──────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Collapsed View:**
- Chevron (▼) to expand
- Admin name and email
- Module count badge
  - Green badge: Has access to N modules
  - Red "No Access": No permissions assigned

### Expanded View
Click any admin row to expand and see all 12 modules:

```
┌────────────────────────────────────────────────────────────────────────┐
│ ▼  Juan dela Cruz                           ┌──────────┐  ┌───────┐  │
│    juan.delacruz@palayan.gov.ph             │ 3 Modules│  │ [🗑]  │  │
│                                             └──────────┘  └───────┘  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  📊 Dashboard Overview      [View] [Create] [Edit] [Delete]          │
│  📝 Citizen Reports         [View] [Create] [Edit] [Delete]          │
│  📢 Advisory Broadcast      [View] [Create] [Edit] [Delete]          │
│  🏥 Hospital El Niño Data   [View] [Create] [Edit] [Delete]          │
│  🚨 CDRRMO Operations       [View] [Create] [Edit] [Delete]          │
│  🚒 BFP Operations          [View] [Create] [Edit] [Delete]          │
│  🌾 Agriculture Damages     [View] [Create] [Edit] [Delete]          │
│  💧 Water Interruptions     [View] [Create] [Edit] [Delete]          │
│  ⚡ Power Interruptions     [View] [Create] [Edit] [Delete]          │
│  👥 User Management         [View] [Create] [Edit] [Delete]          │
│  ⚙️  Settings & Categories   [View] [Create] [Edit] [Delete]          │
│  📋 Activity Logs           [View] [Create] [Edit] [Delete]          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Permission Buttons

**Active (granted):**
```
[View]   - Blue filled button
[Create] - Green filled button  
[Edit]   - Orange filled button
[Delete] - Red filled button
```

**Inactive (not granted):**
```
[View]   - Gray outline button
[Create] - Gray outline button
[Edit]   - Gray outline button
[Delete] - Gray outline button
```

**Module with any permission:**
- Row has green background highlight
- Makes it easy to see which modules user has access to

### Actions

#### Toggle Individual Permission
- Click any permission button to grant/revoke
- Button instantly updates (filled = granted, outline = revoked)
- Changes saved to database immediately

#### Revoke All Permissions
- Click 🗑 trash icon in user header
- Confirmation modal appears:
  ```
  ╔════════════════════════════════════════╗
  ║         Revoke All Access              ║
  ╠════════════════════════════════════════╣
  ║ Remove all module permissions for      ║
  ║ this admin? They will no longer be     ║
  ║ able to access any modules.            ║
  ║                                        ║
  ║         [Cancel]  [Revoke All]         ║
  ╚════════════════════════════════════════╝
  ```
- Confirm to remove all permissions
- User's badge changes to "No Access"

---

## Use Cases

### Scenario 1: New Agriculture Department Admin
1. Agriculture department hired new admin "Maria Santos"
2. Super Admin selects "Maria Santos" in dropdown
3. Clicks **"Agriculture Admin"** template
4. Maria instantly gets:
   - ✅ Dashboard (view, create, edit, delete)
   - ✅ Agriculture (view, create, edit, delete)
5. Maria can now log in and only see Dashboard + Agriculture tabs

### Scenario 2: Multi-Department Manager
Admin needs access to multiple emergency services:
1. Select admin user
2. Expand their row
3. Manually enable:
   - CDRRMO Operations: [View] [Create] [Edit]
   - BFP Operations: [View] [Create] [Edit]  
   - Hospital El Niño Data: [View] only
4. Manager can now handle multiple departments with appropriate permissions

### Scenario 3: Read-Only Auditor
Create view-only access:
1. Select auditor user
2. Expand row
3. Enable only [View] buttons for desired modules:
   - Reports: [View]
   - Hospital: [View]
   - CDRRMO: [View]
   - BFP: [View]
   - Agriculture: [View]
4. Auditor can see all data but cannot create/edit/delete

### Scenario 4: Admin Leaving Department
1. Find the user in the list
2. Click 🗑 Revoke All button
3. Confirm removal
4. User immediately loses all module access
5. Their account remains but cannot access any module tabs

---

## Permission Hierarchy

### Dashboard Module
- **Always include Dashboard** in any role
- Dashboard provides overview analytics
- Without Dashboard, admin has no landing page

### Create Permission
- If admin can Create, they probably need View
- Create button won't work without View permission

### Edit Permission  
- Requires View permission to see records
- Edit button appears on existing records

### Delete Permission
- Most dangerous permission
- Only grant to trusted admins
- Recommended: Grant to department heads only

---

## Visual Indicators

### Module Count Badge
```
┌──────────┐     User has access to N modules
│ 3 Modules│     Green = active access
└──────────┘

┌───────────┐    User has no permissions
│ No Access │    Red = blocked
└───────────┘
```

### Module Row Colors
- **Green background** = User has at least one permission for this module
- **Transparent** = User has no access to this module

### Button States
- **Filled color** = Permission granted
- **Gray outline** = Permission not granted
- **Grayed out** = System is processing (don't click)

---

## Best Practices

### 1. Start with Templates
- Use quick templates for common roles
- Saves time and ensures consistency
- All templates include Dashboard automatically

### 2. Grant Minimum Required Access
- Only give permissions user actually needs
- Don't grant Full Module Access unless necessary
- Review permissions regularly

### 3. Document Assignments
- Keep a record of who has what access
- Include reason for special permissions
- Review during staff changes

### 4. Separate Read and Write
- Read-only access: View permission only
- Data entry staff: View + Create
- Department heads: View + Create + Edit + Delete

### 5. Test Before Going Live
- Create test admin account
- Assign permissions
- Log in as test user
- Verify they see correct modules
- Verify they can/cannot perform actions

### 6. Regular Audits
- Review permissions monthly
- Remove access for inactive admins
- Update roles when duties change

---

## Troubleshooting

### "No admin users found"
- Check if admin users exist in system
- Users must have role = 'admin' in profiles table
- Superadmins are excluded from list

### Permission not saving
- Check internet connection
- Look for error modal
- Refresh page and try again
- Check browser console for errors

### User can't see module after granting permission
- Tell user to log out and log back in
- Permissions load on login
- Hard refresh browser (Ctrl+Shift+R)

### Template button doesn't work
- Ensure user is selected in dropdown first
- Check for loading spinner
- Wait for success modal
- Expand user row to verify modules

### Can't revoke permission
- Check if you're superadmin
- Look for error modal
- Some operations may take a few seconds
- Refresh and try again

---

## Security Notes

⚠️ **Super Admin Responsibilities**
- Only Super Admins can manage permissions
- Regular admins cannot see or modify permissions
- All changes are logged (future feature)
- Revoked permissions take effect immediately

🔒 **Database Protection**
- RLS policies prevent unauthorized changes
- CHECK constraints validate module names
- Foreign keys ensure data integrity
- Audit trail in activity_logs (future)

---

**Questions?**
Contact IT Department or System Administrator for assistance with module permissions.

**Documentation Version:** 1.0
**Last Updated:** May 8, 2026
