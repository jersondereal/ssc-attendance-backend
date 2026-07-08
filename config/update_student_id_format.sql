ALTER TABLE students DROP CONSTRAINT IF EXISTS valid_student_id;
-- NOT VALID: applies to new/updated rows only, doesn't require pre-existing
-- malformed student_id values to be fixed before this can be applied.
-- Optional " (n)" suffix (e.g. "24-0951 (1)") is the duplicate-fallback marker
-- used when a student registers with an ID that's already taken.
ALTER TABLE students ADD CONSTRAINT valid_student_id CHECK (student_id ~ '^\d{2}-\d{4,10}( \(\d+\))?$') NOT VALID;
