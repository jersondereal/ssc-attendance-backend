-- Add optional profile image URL to students table (nullable).
-- Run this on an existing database that was created before this column existed.

ALTER TABLE students
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
