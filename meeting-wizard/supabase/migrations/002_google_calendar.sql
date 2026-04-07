-- Add Google Calendar token columns to users
ALTER TABLE users
  ADD COLUMN google_access_token TEXT,
  ADD COLUMN google_refresh_token TEXT,
  ADD COLUMN google_token_expires_at TIMESTAMPTZ,
  ADD COLUMN google_calendar_connected BOOLEAN DEFAULT false;