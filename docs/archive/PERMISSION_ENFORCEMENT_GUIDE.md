# Permission Enforcement Implementation Guide

## Status: Phase 1 Complete ✅
- Module permissions table created
- UI for assigning permissions built
- Superadmin can assign permissions to regular admins

## Now Implementing: Phase 2 - Permission Enforcement

### Changes Made to AdminDashboard.jsx:

1. **Added Permission State** (Lines ~120-122)
   ```javascript
   const [myPermissions, setMyPermissions] = useState({});
   const [permissionsLoaded, setPermissionsLoaded] = useState(false);
   ```

2. **Added Permission Loading** (useEffect on mount)
   - Loads current user's permissions from `admin_module_permissions` table
   - Superadmins bypass this (have all permissions)
   - Converts array to object map for fast lookup

3. **Added Permission Helper Functions**
   ```javascript
   const hasPermission = (module, permType = 'view') => { ... }
   const canViewModule = (module) => hasPermission(module, 'view');
   const canCreate = (module) => hasPermission(module, 'create');
   const canEdit = (module) => hasPermission(module, 'edit');
   const canDelete = (module) => hasPermission(module, 'delete');
   ```

4. **Updated Tabs Array** - Added `module` property to each tab:
   ```javascript
   { id: "overview", label: "Dashboard", icon: <BarChart3 />, module: "dashboard" }
   { id: "reports", label: "Citizen Reports", icon: <FileText />, module: "reports" }
   { id: "advisories", label: "Official Advisories", icon: <Megaphone />, module: "advisories" }
   { id: "hospitals", label: "Hospital Monitoring", icon: <HeartPulse />, module: "hospital" }
   { id: "operations", label: "CDRRMO Operations", icon: <Tent />, module: "cdrrmo" }
   { id: "bfp", label: "BFP Operations", icon: <Flame />, module: "bfp" }
   { id: "agriculture", label: "Agricultural Damages", icon: <Sprout />, module: "agriculture" }
   { id: "water", label: "Water Utility", icon: <Droplet />, module: "water" }
   { id: "power", label: "Power Utility", icon: <Zap />, module: "power" }
   { id: "users", label: "Users", icon: <Users />, module: "users" }
   { id: "settings", label: "Offices & Categories", icon: <Building />, module: "settings" }
   { id: "logs", label: "Activity Logs", icon: <Activity />, module: "logs" }
   ```

5. **Filter Visible Tabs** - Only show tabs user has `can_view` permission for:
   ```javascript
   const visibleTabs = tabs.filter(tab => {
     if (isSuperadmin) return true;
     if (!permissionsLoaded) return false;
     return canViewModule(tab.module);
   });
   ```

6. **Updated Sidebar** - Use `visibleTabs` instead of `tabs`

### Still TODO - Add Permission Checks to Action Buttons:

#### Advisories Tab (module: "advisories")
- Line ~3103: Hide "New Advisory" button if !canCreate('advisories')
- Hide Edit/Delete buttons in advisory cards if !canEdit/!canDelete

#### Hospitals Tab (module: "hospital")
- Line ~3533: Hide "Add Record" button if !canCreate('hospital')
- Hide edit/delete buttons in records if !canEdit/!canDelete

#### CDRRMO Operations Tab (module: "cdrrmo")
- Line ~4098: Hide "Add Record" button if !canCreate('cdrrmo')
- Hide edit/delete in evacuation records if !canEdit/!canDelete

#### BFP Operations Tab (module: "bfp")
- Line ~4466: Hide "Add Record" button if !canCreate('bfp')
- Hide edit/delete in BFP records if !canEdit/!canDelete

#### Agriculture Tab (module: "agriculture")
- Line ~4893: Hide "Add Record" button if !canCreate('agriculture')
- Hide edit/delete in damage records if !canEdit/!canDelete

#### Water Utility Tab (module: "water")
- Similar pattern - hide create/edit/delete buttons based on permissions

#### Power Utility Tab (module: "power")
- Similar pattern - hide create/edit/delete buttons based on permissions

#### Reports Tab (module: "reports")
- Hide status change buttons if !canEdit('reports')

#### Users Tab (module: "users") - Superadmin only
- Already protected by `isSuperadmin` check
- Hide "Create Admin" if !canCreate('users')

#### Settings Tab (module: "settings") - Superadmin only
- Already protected by `isSuperadmin` check
- Hide Add Office/Category buttons if !canCreate('settings')
- Hide delete buttons if !canDelete('settings')

### Module Names Reference:
- dashboard
- reports
- advisories
- hospital
- cdrrmo
- bfp
- agriculture
- water
- power
- users (superadmin only)
- settings (superadmin only)
- logs (superadmin only)

## Testing Plan:

1. **Test with Superadmin**:
   - All tabs visible ✅
   - All action buttons visible ✅
   - Can perform all operations ✅

2. **Test with CDRRMO Admin** (only dashboard + cdrrmo permissions):
   - Should only see: Dashboard, CDRRMO Operations tabs
   - Should only see Add/Edit/Delete buttons in CDRRMO tab
   - Other tabs should be hidden

3. **Test with BFP Admin** (only dashboard + bfp permissions):
   - Should only see: Dashboard, BFP Operations tabs
   - Should only see Add/Edit/Delete buttons in BFP tab

4. **Test with Reports Manager** (dashboard, reports, advisories):
   - Should see: Dashboard, Citizen Reports, Official Advisories tabs
   - Can manage reports and advisories
   - Cannot see hospital/cdrrmo/bfp/agriculture/water/power tabs

5. **Test with View-Only Permission** (can_view=true, can_create/edit/delete=false):
   - Can see the tab content
   - Cannot see Add/Edit/Delete buttons
   - Read-only access

## Next Phase: Database-Level Enforcement

After UI enforcement works, add RLS policies to enforce permissions at database level:
- Check `has_module_permission()` function in RLS policies
- Apply to: hospital_capacity, cdrrmo_evacuations, bfp_daily_operations, agriculture_damages, water_interruptions, power_interruptions, advisories, reports tables
