-- Username handles: unique, lowercase, 3-30 chars (a-z, 0-9, _, .)
-- Nullable so pre-existing rows backfill on next login (AuthService).
ALTER TABLE users ADD COLUMN username VARCHAR(30) UNIQUE;
CREATE INDEX idx_users_username ON users(username);

-- Enforce handle shape for non-null values (NULL passes CHECK in Postgres).
ALTER TABLE users
    ADD CONSTRAINT chk_users_username
    CHECK (username ~ '^[a-z0-9_.]{3,30}$');
