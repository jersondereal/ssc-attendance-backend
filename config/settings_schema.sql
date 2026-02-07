-- Create settings table for application configuration
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    UNIQUE(category, key) -- Ensure unique key per category
);
