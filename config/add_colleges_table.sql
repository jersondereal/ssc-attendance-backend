-- Migration: Add colleges table for existing databases
-- Run this on a DB that already has students/events but no colleges table.
-- Safe to run: uses IF NOT EXISTS where supported.

-- 1. Create colleges table
CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_colleges_code ON colleges(code);

-- 2. Seed the 8 default colleges (ignore if already present)
INSERT INTO colleges (code, name, display_order) VALUES
    ('coe', 'College of Engineering', 1),
    ('cit', 'College of Industrial Technology', 2),
    ('cict', 'College of Information and Communications Technology', 3),
    ('cbm', 'College of Business and Management', 4),
    ('chtm', 'College of Hospitality and Tourism Management', 5),
    ('coeed', 'College of Education', 6),
    ('cas', 'College of Arts and Sciences', 7),
    ('ccrim', 'College of Criminology', 8)
ON CONFLICT (code) DO NOTHING;

-- 3. Add courses/sections/school_years to events if missing (for DBs created from minimal schema)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'courses'
    ) THEN
        ALTER TABLE events ADD COLUMN courses JSONB;
        ALTER TABLE events ADD COLUMN sections JSONB;
        ALTER TABLE events ADD COLUMN school_years JSONB;
    END IF;
END $$;

-- 4. Fix student college values: set invalid codes to 'coe' so they reference a valid college
UPDATE students
SET college = 'coe'
WHERE college IS NULL OR college NOT IN (SELECT code FROM colleges);

-- 5. Optional: add FK from students.college to colleges(code) (uncomment if desired)
-- ALTER TABLE students
--   ADD CONSTRAINT fk_students_college
--   FOREIGN KEY (college) REFERENCES colleges(code);
