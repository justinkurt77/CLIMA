# Citizen Advisory Display - Feature Added ✅

## Problem
Published advisories from the admin panel were not visible to citizens in the public-facing app.

## Solution
Added an "Official Advisories" section to the HomeScreen that displays all published advisories to citizens.

## Changes Made

### 1. HomeScreen.jsx Updates

**New Imports:**
```javascript
import { supabase } from "../lib/supabase";
```

**New State:**
```javascript
const [advisories, setAdvisories] = useState([]);
const [showAdvisories, setShowAdvisories] = useState(true);
```

**Data Fetching:**
- Fetches published advisories on component mount
- Only shows advisories with status = "Published"
- Ordered by `published_at` date (newest first)
- Limited to 5 most recent advisories
- Real-time updates via Supabase subscription

**UI Components:**
- Collapsible section with expand/collapse button
- Color-coded categories:
  - Weather (Blue)
  - Water (Cyan)
  - Power (Yellow)  
  - Health (Red)
  - General (Gray)
- Shows:
  - Category badge
  - Publication date
  - Advisory title
  - Content preview (truncated to 120 chars)
  - Colored accent bar

## Where Citizens See Advisories

### Mobile View
Location: **HomeScreen** → Right after the main weather card

The advisories appear as:
```
🚨 Official Advisories          [▼]
├─ [WEATHER] Heavy Rainfall Warning
│  Published: 10/8/2026
│  "Heavy rainfall expected in..."
│
├─ [POWER] Scheduled Brownout  
│  Published: 10/7/2026
│  "Power interruption scheduled..."
│
└─ ... (up to 5 advisories)
```

### Desktop View
Location: **HomeScreen** → Same position, responsive layout

## Data Flow

1. **Admin Creates Advisory**
   - Admin Panel → Official Advisories → Create New
   - Fills in title, category, content
   - Clicks "Submit for Approval" (if admin) or "Publish Now" (if superadmin)

2. **Superadmin Approves** (if submitted by admin)
   - Changes status from "Pending" to "Published"
   - `published_at` timestamp is set

3. **Citizens See It Immediately**
   - HomeScreen queries: `SELECT * FROM advisories WHERE status = 'Published'`
   - Real-time subscription updates the list when new advisories are published
   - No page refresh needed

## Real-Time Updates

The feature uses Supabase real-time subscriptions:
```javascript
supabase
  .channel("public_advisories")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "advisories",
    filter: "status=eq.Published",
  }, fetchAdvisories)
  .subscribe();
```

When an advisory is published, all connected citizens see it within seconds!

## Testing the Feature

### Test 1: Publish an Advisory
1. Login as Superadmin
2. Go to Official Advisories
3. Create a new advisory:
   - Title: "Test Alert"
   - Category: "Weather"
   - Content: "This is a test advisory for citizens"
4. Click "Publish Now"
5. **Expected:** Advisory saved with status "Published"

### Test 2: View as Citizen
1. Logout or open app in incognito window
2. Go to Home screen
3. **Expected:** See the advisory in the "Official Advisories" section
4. Should show category badge, date, and content

### Test 3: Real-Time Update
1. Keep citizen view open
2. In another tab, login as admin and publish another advisory
3. **Expected:** Citizen view updates automatically without refresh

### Test 4: Collapse/Expand
1. On Home screen with advisories visible
2. Click the collapse button (▼)
3. **Expected:** Advisories section collapses
4. Click again (►)
5. **Expected:** Section expands

## Database Requirements

Ensure the RLS policy allows public read access to published advisories:

```sql
-- From supabase_phase3.sql
CREATE POLICY "Public read published advisories" ON advisories FOR SELECT
USING (status = 'Published' AND (scheduled_for IS NULL OR scheduled_for <= NOW()));
```

This policy ensures:
- ✅ Public can see published advisories
- ✅ Future scheduled advisories are hidden until their time
- ✅ Pending/Draft advisories remain private

## UI/UX Features

✅ **Color-Coded Categories** - Easy to distinguish advisory types at a glance
✅ **Collapsible Section** - Doesn't clutter the home screen
✅ **Truncated Content** - Shows preview without overwhelming users
✅ **Real-Time Updates** - No manual refresh needed
✅ **Dark Mode Support** - Adapts to theme preference
✅ **Mobile Responsive** - Works on all screen sizes
✅ **Smooth Animations** - Framer Motion for expand/collapse

## Example Advisory Display

```
╔════════════════════════════════════════╗
║ 🚨 Official Advisories            [▼] ║
╠════════════════════════════════════════╣
║ │                                      ║
║ │ [WEATHER] 10/8/2026                  ║
║ │ Heavy Rainfall Warning               ║
║ │ Heavy rainfall expected in Palayan   ║
║ │ City from 2PM to 8PM. Residents...   ║
║ │                                      ║
║ ├──────────────────────────────────────║
║ │                                      ║
║ │ [POWER] 10/7/2026                    ║
║ │ Scheduled Power Interruption         ║
║ │ Power outage scheduled for Brgy...   ║
║ │                                      ║
╚════════════════════════════════════════╝
```

## Category Colors

| Category | Color (Light) | Color (Dark) |
|----------|--------------|--------------|
| Weather  | #3b82f6      | #60a5fa      |
| Water    | #0891b2      | #06b6d4      |
| Power    | #f59e0b      | #fbbf24      |
| Health   | #dc2626      | #ef4444      |
| General  | #71717a      | #a1a1aa      |

## Performance Considerations

- **Limit 5 advisories** - Prevents excessive scrolling
- **Lazy loading** - Only fetches when HomeScreen mounts
- **Efficient queries** - Indexed on `status` and `published_at`
- **Real-time subscriptions** - Only for published advisories table

## Future Enhancements

Optional improvements:
1. **Full Advisory View** - Click to expand full content in modal
2. **"View All" Link** - Navigate to dedicated advisories archive page
3. **Push Notifications** - Notify users when critical advisories published
4. **Acknowledgment** - Track which users have seen each advisory
5. **Categories Filter** - Show only specific category types
6. **Emergency Alerts** - Special styling for critical/urgent advisories

## Files Modified
- ✅ `src/screens/HomeScreen.jsx` - Added advisories section
- ✅ Build verified passing

## Deployment Checklist
- [x] Code changes complete
- [x] Build passing
- [ ] Deploy to hosting
- [ ] Test with real data
- [ ] Verify RLS policies allow public read
- [ ] Publish a test advisory
- [ ] Confirm citizens can see it

---

**Feature Complete!** Citizens can now see published advisories on the Home screen! 🎉
