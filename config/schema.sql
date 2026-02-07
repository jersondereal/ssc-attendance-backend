-- =============================================================================
-- WARNING: THIS FILE DROPS ALL TABLES AND DELETES ALL DATA.
-- Only run this on a NEW/EMPTY database or when you intend to wipe everything.
-- For an EXISTING database with data you want to keep, use migration scripts
-- instead: add_colleges_table.sql, migrate_course_to_college.sql, etc.
-- =============================================================================

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS colleges;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;

-- Create users table for SSC administration
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (
        role IN (
            'president',           -- SSC President
            'vice_president',      -- SSC Vice President
            'admin',               -- System Administrator (legacy)
            'administrator',       -- New: Administrator
            'moderator',           -- New: Moderator
            'viewer'               -- New: Viewer
        )
    ),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create settings table for application configuration
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key) -- Ensure unique key per category
);
-- Create colleges table (must exist before students if using FK)
CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create students table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    college VARCHAR(50) NOT NULL,
    year VARCHAR(2) NOT NULL,
    section VARCHAR(2) NOT NULL,
    rfid VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_student_id CHECK (student_id ~ '^\d{2}-\d{4}$') -- Ensures format YY-XXXX
);
-- Create events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    location VARCHAR(100) NOT NULL,
    fine DECIMAL(10, 2) NOT NULL,
    courses JSONB,
    sections JSONB,
    school_years JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) REFERENCES students(student_id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Excused')),
    is_paid BOOLEAN DEFAULT false NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, event_id) -- Prevent duplicate attendance records
);
-- Create indexes for better query performance
CREATE INDEX idx_colleges_code ON colleges(code);
CREATE INDEX idx_students_college ON students(college);
CREATE INDEX idx_students_year ON students(year);
CREATE INDEX idx_students_section ON students(section);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_event_id ON attendance(event_id);
CREATE INDEX idx_events_date ON events(event_date);
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';
-- Create triggers to automatically update updated_at
CREATE TRIGGER update_colleges_updated_at BEFORE
UPDATE ON colleges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE
UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE
UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE
UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE
UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Create function to notify attendance changes
CREATE OR REPLACE FUNCTION notify_attendance_change() RETURNS TRIGGER AS $$ BEGIN PERFORM pg_notify(
        'attendance_changes',
        json_build_object(
            'operation',
            TG_OP,
            'record',
            row_to_json(NEW)
        )::text
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for attendance changes
CREATE TRIGGER attendance_change_notification
AFTER
INSERT
    OR
UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION notify_attendance_change();

-- Seed default colleges
INSERT INTO colleges (code, name, display_order) VALUES
    ('coe', 'College of Engineering', 1),
    ('cit', 'College of Industrial Technology', 2),
    ('cict', 'College of Information and Communications Technology', 3),
    ('cbm', 'College of Business and Management', 4),
    ('chtm', 'College of Hospitality and Tourism Management', 5),
    ('coeed', 'College of Education', 6),
    ('cas', 'College of Arts and Sciences', 7),
    ('ccrim', 'College of Criminology', 8);

-- Seed default settings (general + system)
INSERT INTO settings (category, key, value, description) VALUES
    ('general', 'app_name', 'SSC Attendance Online', 'Application name'),
    ('general', 'council_name', 'Student Supreme Council', 'Council name'),
    ('general', 'logo_data', '', 'Logo data (base64)'),
    ('system', 'maintenance_mode', 'false', 'Maintenance mode flag'),
    ('system', 'feature_access', '{"viewer":{"studentRegistration":true},"moderator":{"studentRegistration":true,"addEvent":true,"editEvent":true,"deleteEvent":true}}', 'Feature access configuration');