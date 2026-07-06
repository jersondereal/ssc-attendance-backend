-- Migration: Add attendance_history table for existing databases
-- Run this on a DB that already has users/students/events/attendance but no
-- attendance_history table. Safe to run: uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS attendance_history (
    id SERIAL PRIMARY KEY,
    attendance_id INTEGER REFERENCES attendance(id) ON DELETE CASCADE,
    student_id VARCHAR(10) REFERENCES students(student_id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    previous_status VARCHAR(20) CHECK (previous_status IN ('Present', 'Absent', 'Excused')),
    new_status VARCHAR(20) NOT NULL CHECK (new_status IN ('Present', 'Absent', 'Excused')),
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_via VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (changed_via IN ('manual', 'rfid')),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_history_attendance_id ON attendance_history(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_history_student_id ON attendance_history(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_history_event_id ON attendance_history(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_history_changed_at ON attendance_history(changed_at);
