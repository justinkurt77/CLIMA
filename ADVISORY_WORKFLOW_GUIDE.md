# Advisory Workflow Guide

## ✅ Complete Lifecycle - Now Implemented!

### Visual Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADVISORY LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  DRAFT  │ ◄─────────────────────────────────┐
    └────┬────┘                                    │
         │                                         │
         │ Submit for Approval                     │
         ▼                                         │
    ┌─────────┐                                    │
    │ PENDING │                                    │ Unpublish
    └────┬────┘                                    │ (NEW!)
         │                                         │
         │ Approve & Publish (Superadmin)         │
         ▼                                         │
    ┌───────────┐                                  │
    │ PUBLISHED │──────────────────────────────────┘
    └─────┬─────┘
          │
          │ Archive
          ▼
    ┌──────────┐
    │ ARCHIVED │
    └─────┬────┘
          │
          │ Restore
          │
          └───────────► Back to DRAFT
```

### Status Descriptions

#### 1. **DRAFT** 📝
- **Who can see**: Creator only (admin who created it)
- **Visible to citizens**: ❌ NO
- **Available actions**:
  - ✏️ Edit content
  - 📤 Submit for approval (moves to Pending)
  - 🗑️ Delete permanently

#### 2. **PENDING** ⏳
- **Who can see**: All admins
- **Visible to citizens**: ❌ NO
- **Available actions**:
  - ✏️ Edit content
  - ✅ Approve & Publish (Superadmin only - moves to Published)
  - 🗑️ Delete permanently

#### 3. **PUBLISHED** ✅
- **Who can see**: Everyone (all citizens on HomeScreen)
- **Visible to citizens**: ✅ YES
- **Available actions** (Superadmin only):
  - **🔻 Unpublish** (NEW! - moves back to Draft, hides from citizens)
  - **📦 Archive** (NEW! - moves to Archived, preserves record)
  - 🗑️ Delete permanently

#### 4. **ARCHIVED** 📦
- **Who can see**: Admins only
- **Visible to citizens**: ❌ NO
- **Available actions**:
  - **♻️ Restore** (NEW! - moves back to Draft for re-publishing)
  - 🗑️ Delete permanently

---

## User Scenarios

### Scenario 1: Publish Advisory with Typo
**Problem**: You just published an advisory but noticed a typo.

**Old way**: Delete and recreate ❌

**New way**: ✅
1. Click "Unpublish" (advisory goes to Draft)
2. Edit to fix typo
3. Submit for approval again
4. Approve & Publish

### Scenario 2: Seasonal Advisory
**Problem**: Heat advisory only relevant for summer months.

**Old way**: Delete after summer, recreate next year ❌

**New way**: ✅
1. After summer ends, click "Archive"
2. Next summer, find archived advisory
3. Click "Restore" (goes to Draft)
4. Update dates/content if needed
5. Publish again

### Scenario 3: Outdated Advisory
**Problem**: Advisory no longer relevant but want to keep record.

**Old way**: Leave published (confuses citizens) or delete (loses record) ❌

**New way**: ✅
1. Click "Archive"
2. Advisory hidden from citizens
3. Record preserved for historical reference

### Scenario 4: Emergency Update
**Problem**: Need to update published advisory immediately.

**New way**: ✅
1. Click "Unpublish" (immediate - citizens stop seeing it)
2. Edit with urgent updates
3. Submit → Approve → Publish
4. Updated advisory now live

---

## Button Reference

### For DRAFT Status
| Button | Icon | Who Sees | Action |
|--------|------|----------|--------|
| Edit | ✏️ | Creator | Opens edit form |
| Publish | ✅ | Superadmin only | Publishes immediately |
| Delete | 🗑️ | Creator | Deletes permanently |

### For PENDING Status
| Button | Icon | Who Sees | Action |
|--------|------|----------|--------|
| Edit | ✏️ | All admins | Opens edit form |
| Approve & Publish | ✅ | Superadmin only | Publishes and notifies |
| Delete | 🗑️ | Superadmin | Deletes permanently |

### For PUBLISHED Status
| Button | Icon | Who Sees | Action |
|--------|------|----------|--------|
| **Unpublish** | 🔻 | **Superadmin only** | **Returns to Draft** |
| **Archive** | 📦 | **Superadmin only** | **Preserves & hides** |
| Delete | 🗑️ | Superadmin | Deletes permanently |

### For ARCHIVED Status
| Button | Icon | Who Sees | Action |
|--------|------|----------|--------|
| **Restore** | ♻️ | **Superadmin only** | **Returns to Draft** |
| Delete | 🗑️ | Superadmin | Deletes permanently |

---

## How to Test Unpublish Feature

### Step-by-Step Test
1. **Create and publish** an advisory:
   ```
   - Create new advisory
   - Submit for approval
   - (As superadmin) Approve & Publish
   - Verify it appears on citizen HomeScreen
   ```

2. **Unpublish** the advisory:
   ```
   - In admin dashboard, find the PUBLISHED advisory
   - Look for orange "Unpublish" button
   - Click "Unpublish"
   - Confirm in modal
   - Status changes to "DRAFT"
   ```

3. **Verify** unpublish worked:
   ```
   - Check citizen HomeScreen → advisory should be GONE
   - Check admin dashboard → advisory still in list (Draft status)
   - Check database → published_at is NULL
   ```

4. **Re-publish** if needed:
   ```
   - Click "Publish" button (green)
   - Confirm in modal
   - Advisory appears on citizen screen again
   ```

---

## Database Structure

The `advisories` table tracks state with these fields:

```sql
- status: TEXT ('Draft', 'Pending', 'Published', 'Archived')
- published_at: TIMESTAMPTZ (NULL when unpublished)
- created_at: TIMESTAMPTZ (always set)
- updated_at: TIMESTAMPTZ (updates on edit)
```

### RLS Policies
- **Citizens**: Can read WHERE status = 'Published'
- **Admins**: Can read WHERE author_id = auth.uid() OR department matches
- **Superadmins**: Can read all

---

## Quick Reference Card

```
┌──────────────────────────────────────────────────┐
│           ADVISORY QUICK ACTIONS                 │
├──────────────────────────────────────────────────┤
│ Need to fix typo?           → Unpublish → Edit  │
│ Seasonal content?           → Archive → Restore  │
│ No longer relevant?         → Archive            │
│ Emergency update?           → Unpublish → Edit   │
│ Keep as template?           → Archive            │
│ Publish next year?          → Restore → Publish  │
└──────────────────────────────────────────────────┘
```

---

**Status**: ✅ Fully Implemented
**Build**: ✅ Passing
**Ready for**: Production Testing

All buttons are functional with proper modals and confirmations!
