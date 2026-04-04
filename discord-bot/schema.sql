-- Discord bot tables for MatemáticaTop
-- Run this in Supabase SQL Editor

-- Add discord_user_id to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_user_id TEXT;
CREATE INDEX IF NOT EXISTS profiles_discord_user_id_idx ON profiles (discord_user_id);

-- Discord sessions table
CREATE TABLE IF NOT EXISTS discord_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(discord_user_id)
);

-- Magic link tokens for login
CREATE TABLE IF NOT EXISTS discord_magic_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

-- Index for quick token lookup
CREATE INDEX IF NOT EXISTS discord_magic_links_token_idx ON discord_magic_links (token);
CREATE INDEX IF NOT EXISTS discord_magic_links_discord_user_idx ON discord_magic_links (discord_user_id);

-- Cleanup old magic links (run periodically)
DELETE FROM discord_magic_links WHERE expires_at < NOW() OR used = TRUE;

-- Cleanup expired sessions
DELETE FROM discord_sessions WHERE expires_at < NOW();
