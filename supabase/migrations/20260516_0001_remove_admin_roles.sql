-- Migration: Remove is_admin column (Phase 5: Single-team model)
-- Single-team model doesn't need role-based access control
-- Everyone has full access to all projects and tasks

ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;
