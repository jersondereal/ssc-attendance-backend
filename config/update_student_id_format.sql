ALTER TABLE students DROP CONSTRAINT IF EXISTS valid_student_id;
-- NOT VALID: applies to new/updated rows only, doesn't require pre-existing
-- malformed student_id values to be fixed before this can be applied.
ALTER TABLE students ADD CONSTRAINT valid_student_id CHECK (student_id ~ '^\d{2}-(\d{4}|\d{6})$') NOT VALID;
