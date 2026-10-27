# Implementation Plan: Agricultural Damages Module

This plan adds a new Agricultural Damages tracking module to the Admin Dashboard. Palayan City is an agricultural city (rice farming capital), and the Super El Niño causes drought and crop damage. The module will track per-report agricultural damage assessments filed by city agriculture staff, following the same per-operation pattern used in CDRRMO Operations and BFP Operations modules.

## Codebase Context

**File**: `c:\Users\User\CLIMA\src\screens\AdminDashboard.jsx` (4191 lines)
**Build System**: Vite + React 19.2.0
**Styling**: Inline styles with dynamic theming
**Database**: Supabase (PostgreSQL)
**Pattern Reference**: BfpOperationsTab (lines 3721-4095) and OperationsTab (lines 3371-3720)

### Key Architectural Patterns Found

1. **Tab Registration** (lines 195-207): Tabs array with `id`, `label`, and `icon`
2. **Header Title Mapping** (lines 275-286): Switch-style title display in header
3. **Tab Content Sections** (lines 308-460+): Each tab wrapped in `motion.div` with `variants={tabVariants}` and `animate={activeTab === "id" ? "active" : "inactive"}`
4. **Per-Operation Components** (BfpOperationsTab, OperationsTab): 
   - Individual operation records (not daily aggregates)
   - Form with date validation preventing future dates
   - Records grouped by date in view mode with expandable accordions
   - Add/View sub-tabs
   - Analytics cards showing last 7 days statistics
   - Operation type badges with color coding
5. **Database Pattern**: Supabase tables with operation_date, operation_time, operation_type (enum), location, description, and type-specific metrics
6. **SQL Migration Pattern**: Per-record tables with RLS policies, indexes, and sample data (see `supabase_cdrrmo_operations_per_record.sql`)

---

## Implementation Steps

- [ ] 1. **Add Sprout icon import to lucide-react imports**
      
      Add `Sprout` to the destructured import from "lucide-react" at line 3-7.
      
      **Files**: `c:\Users\User\CLIMA\src\screens\AdminDashboard.jsx` (line 3-7)
      
      **Verify**: Run `npm run build` and confirm no import errors. Build should complete successfully.

- [ ] 2. **Add "agriculture" tab to tabs array**
      
      Insert new tab entry in the `tabs` array after the "bfp" entry (around line 202, before "water" tab). The tab should have:
      - `id: "agriculture"`
      - `label: "Agricultural Damages"`
      - `icon: <Sprout size={18} />`
      
      **Files**: `c:\Users\User\CLIMA\src\screens\AdminDashboard.jsx` (line 195-207)
      
      **Verify**: Run `npm run dev`, open browser to Admin Dashboard, confirm new "Agricultural Damages" tab appears in sidebar with Sprout icon between BFP Operations and Water Utility.

- [ ] 3. **Add "Agricultural Damages" header title case**
      
      Add header title mapping for agriculture tab in the header section where other tab titles are displayed (around line 282, after `{activeTab === "bfp" && "BFP Operations & Fire Risk"}`):
      ```jsx
      {activeTab === "agriculture" && "Agricultural Damages & Crop Losses"}
      ```
      
      **Files**: `c:\Users\User\CLIMA\src\screens\AdminDashboard.jsx` (line 275-286)
      
      **Verify**: In dev mode, click on Agricultural Damages tab and confirm header shows "Agricultural Damages & Crop Losses".

- [ ] 4. **Add agriculture tab motion.div section**
      
      Insert new `motion.div` section after the BFP Operations section (after line 399, before water utility section starting around line 402). The section should:
      - Use `variants={tabVariants}`, `initial="inactive"`, `animate={activeTab === "agriculture" ? "active" : "inactive"}`
      - Include `style={{ width: "100%", padding: 32, boxSizing: "border-box" }}`
      - Render `<AgricultureDamagesTab />` component with all standard props: `S`, `cardStyle`, `inputStyle`, `selectStyle`, `btnPrimary`, `btnDanger`, `isSuperadmin`, `adminDepartment`, `showSuccessModal`, `showErrorModal`, `showConfirmModal`
      
      **Files**: `c:\Users\User\CLIMA\src\screens\AdminDashboard.jsx` (insert after line 399)
      
      **Verify**: Run `npm run build`. Build may fail referencing undefined AgricultureDamagesTab component (expected at this stage - will be resolved in next step).

- [ ] 5. **Create AgricultureDamagesTab component**
      
      Add complete `AgricultureDamagesTab` function component after BfpOperationsTab (after line 4095, before WaterUtilityTab starting around line 4099). Follow the BfpOperationsTab pattern exactly with these agriculture-specific adaptations:
      
      **State Structure**:
      ```javascript
      const [formData, setFormData] = useState({
        assessment_date: new Date().toISOString().split('T')[0],
        assessment_time: "",
        damage_type: "drought_impact",
        crop_type: "rice",
        location: "",
        description: "",
        area_affected_hectares: 0,
        estimated_loss_kg: 0,
        estimated_value_loss: 0,
        farmers_affected: 0
      });
      ```
      
      **Operation Types** (damage_type field):
      - `drought_impact` - Drought Impact
      - `crop_failure` - Crop Failure
      - `irrigation_shortage` - Irrigation Shortage
      - `pest_infestation` - Pest Infestation
      - `heat_stress` - Heat Stress
      - `soil_degradation` - Soil Degradation
      
      **Crop Types** (crop_type field):
      - `rice` - Rice (Palay)
      - `corn` - Corn
      - `vegetables` - Vegetables
      - `root_crops` - Root Crops
      - `fruits` - Fruits
      - `other` - Other Crops
      
      **Database Table**: `agriculture_damages` (to be created in SQL migration)
      
      **Analytics Cards** (last 7 days):
      - Total Assessments
      - Drought Impact incidents
      - Crop Failures
      - Irrigation Shortages
      - Total Area Affected (hectares)
      - Total Farmers Affected
      - Total Estimated Loss (₱)
      
      **Badge Colors** (damage_type):
      - `drought_impact`: { bg: "#fef3c7", color: "#92400e" } (yellow)
      - `crop_failure`: { bg: "#fee2e2", color: "#991b1b" } (red)
      - `irrigation_shortage`: { bg: "#dbeafe", color: "#1e40af" } (blue)
      - `pest_infestation`: { bg: "#f3e8ff", color: "#6b21a8" } (purple)
      - `heat_stress`: { bg: "#fed7aa", color: "#9a3412" } (orange)
      - `soil_degradation`: { bg: "#e7e5e4", color: "#57534e" } (stone)
      
      **Form Fields** (in this order):
      1. Assessment Date (date input, max=today, validation prevents future dates)
      2. Assessment Time (time input)
      3. Damage Type (select with 6 options above)
      4. Crop Type (select with 6 options above)
      5. Location (text input, placeholder: "e.g., Brgy. Atate")
      6. Description (textarea, placeholder: "Details of agricultural damage assessment...")
      7. Area Affected (number input, label: "Area Affected (hectares)")
      8. Estimated Loss (number input, label: "Estimated Crop Loss (kg)")
      9. Estimated Value Loss (number input, label: "₱ Estimated Value Loss")
      10. Farmers Affected (number input)
      
      **Component Title**: "Palayan City Agricultural Damages"
      **Subtitle**: "Track crop damage and agricultural losses from Super El Niño"
      
      **Date Validation**: Must include the same future-date validation as BfpOperationsTab (lines 3774-3780)
      
      **View Mode**: Group records by assessment_date with expandable accordions (same pattern as BfpOperationsTab lines 4050-4095)
      
      **Files**: `c:\Users\User\CLIMA\src\screens\AdminDashboard.jsx` (insert after line 4095)
      
      **Verify**: Run `npm run build` and confirm successful compilation. Start dev server with `npm run dev`, navigate to Agricultural Damages tab, confirm form renders with all 10 fields and Add/View sub-tabs work.

- [ ] 6. **Create SQL migration file for agriculture_damages table**
      
      Create `supabase_agriculture_damages.sql` following the exact pattern from `supabase_cdrrmo_operations_per_record.sql`. Include:
      
      **Table Schema**:
      - `id` BIGSERIAL PRIMARY KEY
      - `assessment_date` DATE NOT NULL
      - `assessment_time` TIME NOT NULL
      - `damage_type` TEXT NOT NULL CHECK (damage_type IN ('drought_impact', 'crop_failure', 'irrigation_shortage', 'pest_infestation', 'heat_stress', 'soil_degradation'))
      - `crop_type` TEXT NOT NULL CHECK (crop_type IN ('rice', 'corn', 'vegetables', 'root_crops', 'fruits', 'other'))
      - `location` TEXT NOT NULL
      - `description` TEXT
      - `area_affected_hectares` DECIMAL(10,2) DEFAULT 0
      - `estimated_loss_kg` DECIMAL(12,2) DEFAULT 0
      - `estimated_value_loss` DECIMAL(15,2) DEFAULT 0
      - `farmers_affected` INTEGER DEFAULT 0
      - `created_at` TIMESTAMPTZ DEFAULT NOW()
      - `updated_at` TIMESTAMPTZ DEFAULT NOW()
      
      **Indexes**:
      - `idx_agri_damages_date` ON `assessment_date DESC, assessment_time DESC`
      - `idx_agri_damages_type` ON `damage_type`
      - `idx_agri_damages_crop` ON `crop_type`
      
      **RLS Policies**: Same pattern as CDRRMO operations (authenticated users can view, admins can insert/update/delete)
      
      **Updated_at Trigger**: Same pattern as CDRRMO operations
      
      **Sample Data**: 8-10 sample records spanning current date to 3 days ago, variety of damage types and crop types, realistic Palayan City barangay locations (Atate, Singalat, Caballero, Malate, Libertad)
      
      **Comments**: Include header comment explaining this tracks agricultural damages from Super El Niño in Palayan City (rice farming capital)
      
      **Files**: `c:\Users\User\CLIMA\supabase_agriculture_damages.sql` (new file)
      
      **Verify**: Review SQL file for syntax errors. User must manually execute this SQL in Supabase SQL Editor to create the table. After execution, test inserting a record through the UI Add form and confirm it appears in View tab grouped by date.

- [ ] 7. **Final integration verification**
      
      Complete end-to-end testing of the Agricultural Damages module:
      
      1. Run `npm run build` - must complete without errors
      2. Start dev server: `npm run dev`
      3. Login to Admin Dashboard
      4. Confirm "Agricultural Damages" tab appears between BFP Operations and Water Utility
      5. Click tab, verify header shows "Agricultural Damages & Crop Losses"
      6. Verify 7 analytics cards display (all showing 0 if no data yet)
      7. Test Add Record form:
         - Try selecting a future date → should show error modal
         - Fill valid record with today's date → should save successfully
         - Confirm success modal appears
      8. Switch to View tab → saved record should appear grouped by date
      9. Test Edit functionality → record should update
      10. Test Delete functionality → should show confirm modal, then delete
      11. Verify records are properly sorted by date DESC and time DESC
      
      **Files**: All modified files in steps 1-6
      
      **Verify**: Run `npm run build && npm run preview` to test production build. Navigate through all functionality listed above. Check browser console for any errors. Verify responsive layout on different screen sizes.

---

## File Change Summary

- **Modified**: `c:\Users\User\CLIMA\src\screens\AdminDashboard.jsx`
  - Line 3-7: Add Sprout import
  - Line 202: Add agriculture tab entry
  - Line 282: Add agriculture header title
  - After line 399: Add agriculture motion.div section
  - After line 4095: Add AgricultureDamagesTab component (~350 lines)

- **Created**: `c:\Users\User\CLIMA\supabase_agriculture_damages.sql`
  - Complete SQL migration for agriculture_damages table

---

## Notes

- The Agricultural Damages module follows the exact same per-operation pattern as CDRRMO Operations and BFP Operations (not daily aggregates)
- Future date validation is critical - agricultural staff should only record past/present assessments
- Palayan City context: This is the rice farming capital of Nueva Ecija, so rice (palay) is the primary crop
- Super El Niño causes severe drought, leading to irrigation shortages, crop failures, and heat stress
- The module tracks individual damage assessment reports, then groups them by date in the view
- Database table must be manually created by executing the SQL file in Supabase before the module is functional
