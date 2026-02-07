-- Migration: Rename students.course to students.college
-- Run this on an existing database that still has the "course" column.
-- Safe to run: uses IF EXISTS / IF NOT EXISTS where supported.

-- 1. Drop the old index (if it exists)
DROP INDEX IF EXISTS idx_students_course;

-- 2. Rename the column
ALTER TABLE students
  RENAME COLUMN course TO college;

-- 3. Create the new index
CREATE INDEX IF NOT EXISTS idx_students_college ON students(college);
