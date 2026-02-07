-- Seed default settings (idempotent)
INSERT INTO settings (category, key, value, description) VALUES
    ('general', 'app_name', 'SSC Attendance Online', 'Application name'),
    ('general', 'council_name', 'Student Supreme Council', 'Council name'),
    ('general', 'logo_data', '', 'Logo data (base64)'),
    ('system', 'maintenance_mode', 'false', 'Maintenance mode flag'),
    ('system', 'feature_access', '{"viewer":{"studentRegistration":true},"moderator":{"studentRegistration":true,"addEvent":true,"editEvent":true,"deleteEvent":true}}', 'Feature access configuration')
ON CONFLICT (category, key)
DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
