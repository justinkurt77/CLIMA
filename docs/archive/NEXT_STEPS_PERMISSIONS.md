# Next Steps: Enforcing Module Permissions

## What's Done ✅

1. **Database Schema** - `supabase_module_permissions.sql`
   - Table created with RLS policies
   - Helper function `has_module_permission()` available
   - CHECK constraints for module names
   - Indexes for performance

2. **Super Admin UI** - Settings Tab in AdminDashboard
   - Module Permissions section (superadmin only)
   - Quick Role Templates
   - Manual permission toggles per module
   - Revoke All functionality
   - Visual indicators and badges

3. **Permission Storage**
   - Admin users stored in `profiles` table
   - Permissions stored in `admin_module_permissions` table
   - Efficient loading and grouping by user_id

## What's Next 🚧

### Phase 1: Load User Permissions on Login

**File to modify:** `src/screens/AdminLogin.jsx`

Add permission loading after successful login:

```javascript
// After fetching user profile
const { data: permissions } = await supabase
  .from("admin_module_permissions")
  .select("module_name, can_view, can_create, can_edit, can_delete")
  .eq("user_id", user.id);

// Store in adminUser state
setAdminUser({
  ...profile,
  permissions: permissions || []
});
```

### Phase 2: Hide Unauthorized Tabs

**File to modify:** `src/screens/AdminDashboard.jsx`

Add permission checking to tab visibility:

```javascript
// Helper function
const hasModuleAccess = (moduleName) => {
  if (isSuperadmin) return true;
  return adminUser?.permissions?.some(
    p => p.module_name === moduleName && p.can_view
  );
};

// In sidebar tabs
{hasModuleAccess('reports') && (
  <SidebarTab
    icon={FileText}
    label="Reports"
    active={activeTab === "reports"}
    onClick={() => setActiveTab("reports")}
  />
)}

{hasModuleAccess('hospital') && (
  <SidebarTab
    icon={HeartPulse}
    label="Hospital"
    active={activeTab === "hospital"}
    onClick={() => setActiveTab("hospital")}
  />
)}

// Repeat for all 12 modules
```

### Phase 3: Hide Unauthorized Actions

**Files to modify:** Each module tab component

Add permission checks for Create/Edit/Delete buttons:

```javascript
// Example in HospitalsTab
const canCreate = isSuperadmin || adminUser?.permissions?.some(
  p => p.module_name === 'hospital' && p.can_create
);

const canEdit = isSuperadmin || adminUser?.permissions?.some(
  p => p.module_name === 'hospital' && p.can_edit
);

const canDelete = isSuperadmin || adminUser?.permissions?.some(
  p => p.module_name === 'hospital' && p.can_delete
);

// Then in JSX
{canCreate && (
  <button onClick={handleAddRecord}>
    <Plus size={16} /> Add Record
  </button>
)}

{canEdit && (
  <button onClick={handleEdit}>
    <Edit2 size={14} />
  </button>
)}

{canDelete && (
  <button onClick={handleDelete}>
    <Trash2 size={14} />
  </button>
)}
```

### Phase 4: Enforce at Database Level

**Files to modify:** RLS policies in Supabase

Add permission checks to RLS policies:

```sql
-- Example for hospital_data table
CREATE POLICY "Admins with hospital module permission can view"
ON hospital_data FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM admin_module_permissions 
    WHERE module_name = 'hospital' 
    AND can_view = true
  )
  OR
  (SELECT (auth.jwt()->>'role')::text) = 'superadmin'
);

CREATE POLICY "Admins with hospital module permission can create"
ON hospital_data FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM admin_module_permissions 
    WHERE module_name = 'hospital' 
    AND can_create = true
  )
  OR
  (SELECT (auth.jwt()->>'role')::text) = 'superadmin'
);

-- Repeat for UPDATE and DELETE
```

### Phase 5: Create Permission Helper Hook

**New file:** `src/hooks/usePermissions.js`

```javascript
import { useMemo } from 'react';

export function usePermissions(adminUser, isSuperadmin) {
  const permissions = useMemo(() => {
    if (isSuperadmin) {
      // Superadmin has all permissions
      return {
        hasModule: (module) => true,
        canView: (module) => true,
        canCreate: (module) => true,
        canEdit: (module) => true,
        canDelete: (module) => true
      };
    }

    const userPerms = adminUser?.permissions || [];
    
    return {
      hasModule: (module) => 
        userPerms.some(p => p.module_name === module && p.can_view),
      
      canView: (module) => 
        userPerms.some(p => p.module_name === module && p.can_view),
      
      canCreate: (module) => 
        userPerms.some(p => p.module_name === module && p.can_create),
      
      canEdit: (module) => 
        userPerms.some(p => p.module_name === module && p.can_edit),
      
      canDelete: (module) => 
        userPerms.some(p => p.module_name === module && p.can_delete)
    };
  }, [adminUser, isSuperadmin]);

  return permissions;
}
```

**Usage in components:**

```javascript
import { usePermissions } from '../hooks/usePermissions';

function HospitalsTab({ adminUser, isSuperadmin }) {
  const perms = usePermissions(adminUser, isSuperadmin);

  return (
    <div>
      {perms.canCreate('hospital') && (
        <button>Add Record</button>
      )}
      
      {perms.canEdit('hospital') && (
        <button>Edit</button>
      )}
      
      {perms.canDelete('hospital') && (
        <button>Delete</button>
      )}
    </div>
  );
}
```

### Phase 6: Add Activity Logging

**File to create:** `supabase_permission_logs.sql`

```sql
-- Log all permission changes
CREATE TABLE permission_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_id UUID REFERENCES profiles(id),
  target_admin_id UUID REFERENCES profiles(id),
  action TEXT CHECK (action IN ('grant', 'revoke', 'template_applied')),
  module_name TEXT,
  permission_type TEXT CHECK (permission_type IN ('can_view', 'can_create', 'can_edit', 'can_delete', 'all')),
  old_value BOOLEAN,
  new_value BOOLEAN,
  template_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Function to log permission changes (trigger)
CREATE OR REPLACE FUNCTION log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO permission_change_logs (
      superadmin_id, target_admin_id, action, module_name,
      permission_type, new_value
    ) VALUES (
      auth.uid(), NEW.user_id, 'grant', NEW.module_name,
      'all', true
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Log individual field changes
    -- (simplified - actual implementation would check each field)
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO permission_change_logs (
      superadmin_id, target_admin_id, action, module_name,
      permission_type, old_value
    ) VALUES (
      auth.uid(), OLD.user_id, 'revoke', OLD.module_name,
      'all', true
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_permission_changes
AFTER INSERT OR UPDATE OR DELETE ON admin_module_permissions
FOR EACH ROW EXECUTE FUNCTION log_permission_change();
```

### Phase 7: Add Unauthorized Access Handling

**File to modify:** `src/screens/AdminDashboard.jsx`

```javascript
// Redirect if user tries to access unauthorized tab
useEffect(() => {
  if (!isSuperadmin && activeTab !== 'overview') {
    const hasAccess = adminUser?.permissions?.some(
      p => p.module_name === activeTab && p.can_view
    );
    
    if (!hasAccess) {
      setActiveTab('overview'); // Redirect to overview
      showErrorModal(
        "Access Denied",
        "You don't have permission to access this module."
      );
    }
  }
}, [activeTab, adminUser, isSuperadmin]);
```

### Phase 8: Add Permission Status Indicators

**Enhancement:** Show permission badges in user profile

```javascript
// In ProfileScreen or AdminDashboard header
<div className="user-permissions">
  <span className="permission-label">Your Access:</span>
  {adminUser?.permissions?.map(p => 
    p.can_view && (
      <span key={p.module_name} className="permission-badge">
        {p.module_name}
      </span>
    )
  )}
</div>
```

## Testing Plan

### Test Case 1: Super Admin
- [ ] Log in as superadmin
- [ ] Verify all tabs visible
- [ ] Verify Module Permissions section visible in Settings
- [ ] Verify can add/edit/delete in all modules

### Test Case 2: Agriculture Admin
- [ ] Create admin user "test_agri@palayan.gov.ph"
- [ ] Super admin assigns "Agriculture Admin" template
- [ ] Log in as test_agri
- [ ] Verify only sees Dashboard + Agriculture tabs
- [ ] Verify can add/edit/delete in Agriculture module
- [ ] Verify cannot see Hospital/CDRRMO/BFP tabs

### Test Case 3: Read-Only User
- [ ] Create admin user "test_viewer@palayan.gov.ph"
- [ ] Super admin grants only View permissions for Reports + Hospital
- [ ] Log in as test_viewer
- [ ] Verify sees Dashboard + Reports + Hospital tabs
- [ ] Verify Add/Edit/Delete buttons are hidden
- [ ] Verify cannot create/modify records via API

### Test Case 4: Multi-Department Manager
- [ ] Create admin user "test_manager@palayan.gov.ph"
- [ ] Super admin grants:
  - CDRRMO: View, Create, Edit
  - BFP: View, Create, Edit
  - Hospital: View only
- [ ] Log in as test_manager
- [ ] Verify sees Dashboard + CDRRMO + BFP + Hospital
- [ ] Verify can edit CDRRMO and BFP but not Hospital
- [ ] Verify Edit/Delete buttons hidden in Hospital

### Test Case 5: Permission Revocation
- [ ] Super admin revokes all permissions from test user
- [ ] Test user logs out and back in
- [ ] Verify sees only Dashboard (or redirected to login)
- [ ] Verify "No Access" message shown

## Migration Checklist

- [ ] Run `supabase_module_permissions.sql` on production
- [ ] Verify super admin can access Settings tab
- [ ] Assign permissions to existing admin users
- [ ] Test with each admin to verify correct access
- [ ] Deploy Phase 1 (load permissions on login)
- [ ] Deploy Phase 2 (hide unauthorized tabs)
- [ ] Deploy Phase 3 (hide unauthorized actions)
- [ ] Deploy Phase 4 (RLS policies)
- [ ] Monitor for permission errors in logs
- [ ] Train super admins on permission management

## Estimated Development Time

- **Phase 1:** 1-2 hours (Load permissions)
- **Phase 2:** 2-3 hours (Hide tabs)
- **Phase 3:** 4-6 hours (Hide actions in all modules)
- **Phase 4:** 3-4 hours (RLS policies for all tables)
- **Phase 5:** 1-2 hours (Permission hook)
- **Phase 6:** 2-3 hours (Activity logging)
- **Phase 7:** 1 hour (Unauthorized access handling)
- **Phase 8:** 1 hour (Status indicators)

**Total:** 15-22 hours

## Priority Order

1. **HIGH**: Phase 1, 2, 3 - Core functionality
2. **MEDIUM**: Phase 4 - Database security
3. **LOW**: Phase 5, 6, 7, 8 - Enhancements

---

**Current Status:** ✅ UI Complete, Permission Storage Ready
**Next Action:** Implement Phase 1 (Load permissions on login)
**Target Date:** May 15, 2026
