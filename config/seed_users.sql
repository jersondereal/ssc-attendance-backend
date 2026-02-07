-- Seed users (passwords are bcrypt-hashed; plain password is "password" for all)
-- Generated with bcrypt 10 rounds. Login with username and password "password".
INSERT INTO users (username, password, role) VALUES
    ('president', '$2b$10$P6AtrT97eFF2P1tEUyRaPeoyYem0RBRnjdj6svQ3nnrQ9CJBDT2Zi', 'administrator'),
    ('vice_president', '$2b$10$P6AtrT97eFF2P1tEUyRaPeoyYem0RBRnjdj6svQ3nnrQ9CJBDT2Zi', 'administrator'),
    ('admin', '$2b$10$P6AtrT97eFF2P1tEUyRaPeoyYem0RBRnjdj6svQ3nnrQ9CJBDT2Zi', 'administrator'),
    ('officer1', '$2b$10$P6AtrT97eFF2P1tEUyRaPeoyYem0RBRnjdj6svQ3nnrQ9CJBDT2Zi', 'moderator'),
    ('officer2', '$2b$10$P6AtrT97eFF2P1tEUyRaPeoyYem0RBRnjdj6svQ3nnrQ9CJBDT2Zi', 'moderator'),
    ('viewer', '$2b$10$P6AtrT97eFF2P1tEUyRaPeoyYem0RBRnjdj6svQ3nnrQ9CJBDT2Zi', 'viewer')
ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role;
