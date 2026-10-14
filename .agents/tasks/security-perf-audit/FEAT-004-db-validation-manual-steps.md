# FEAT-004: Database Input Validation — Manual Steps Required

## What This Does
Adds CHECK constraints and triggers to the Supabase database to validate input lengths,
formats, and values at the database layer — a defense-in-depth measure beyond frontend validation.

## Status
SECURITY_INPUT_VALIDATION_FINAL.sql has already been confirmed working (applied successfully).

## Verification Queries
Run these in Supabase SQL Editor to confirm constraints and triggers are active:

### Check constraints on advisories table
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'advisories'::regclass
ORDER BY conname;
```

### Check triggers on reports table
```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'reports'
ORDER BY trigger_name;
```

### Check triggers on profiles table
```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;
```

### Verify RLS is enabled on all tables
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
All rows should show rowsecurity = true.

## Performance Indexes (Also Manual)
Run c:\Users\User\CLIMA/PERFORMANCE_INDEXES_WORKING.sql in Supabase SQL Editor.
This adds indexes on frequently queried columns for faster report/advisory lookups.
