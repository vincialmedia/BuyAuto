-- Clean up the redundant km column that causes confusion
ALTER TABLE listings DROP COLUMN IF EXISTS km;