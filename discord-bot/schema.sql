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

-- Discord level system (helper/student progress)
CREATE TABLE IF NOT EXISTS discord_level_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('helper', 'student')),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  last_xp_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, discord_user_id, track)
);

CREATE INDEX IF NOT EXISTS discord_level_progress_user_idx
  ON discord_level_progress (discord_user_id, track);

-- Discord exam challenge config/state
CREATE TABLE IF NOT EXISTS discord_exam_challenge_config (
  guild_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed')),
  start_at TIMESTAMPTZ,
  challenge_days INTEGER NOT NULL DEFAULT 20 CHECK (challenge_days > 0 AND challenge_days <= 60),
  question_xp INTEGER NOT NULL DEFAULT 500 CHECK (question_xp >= 0),
  invite_points INTEGER NOT NULL DEFAULT 10 CHECK (invite_points >= 0),
  channel_9ano_id TEXT,
  channel_12ano_id TEXT,
  leaderboard_channel_id TEXT,
  leaderboard_message_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question bank (per guild, year, day)
CREATE TABLE IF NOT EXISTS discord_exam_challenge_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  school_year TEXT NOT NULL CHECK (school_year IN ('9ano', '12ano')),
  day_index INTEGER NOT NULL CHECK (day_index > 0 AND day_index <= 60),
  prompt TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (guild_id, school_year, day_index)
);

CREATE INDEX IF NOT EXISTS discord_exam_challenge_questions_lookup_idx
  ON discord_exam_challenge_questions (guild_id, school_year, day_index);

-- Posted rounds (1 per day/year)
CREATE TABLE IF NOT EXISTS discord_exam_challenge_rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  school_year TEXT NOT NULL CHECK (school_year IN ('9ano', '12ano')),
  day_index INTEGER NOT NULL CHECK (day_index > 0 AND day_index <= 60),
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (guild_id, school_year, day_index)
);

CREATE INDEX IF NOT EXISTS discord_exam_challenge_rounds_open_idx
  ON discord_exam_challenge_rounds (guild_id, status, closes_at);

-- Participant score state
CREATE TABLE IF NOT EXISTS discord_exam_challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  locked_year TEXT CHECK (locked_year IN ('9ano', '12ano')),
  question_xp INTEGER NOT NULL DEFAULT 0 CHECK (question_xp >= 0),
  invite_points INTEGER NOT NULL DEFAULT 0 CHECK (invite_points >= 0),
  active_invites INTEGER NOT NULL DEFAULT 0 CHECK (active_invites >= 0),
  answers_count INTEGER NOT NULL DEFAULT 0 CHECK (answers_count >= 0),
  correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (guild_id, discord_user_id)
);

CREATE INDEX IF NOT EXISTS discord_exam_challenge_participants_rank_idx
  ON discord_exam_challenge_participants (guild_id, locked_year, question_xp DESC, invite_points DESC);

-- Daily answers
CREATE TABLE IF NOT EXISTS discord_exam_challenge_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  school_year TEXT NOT NULL CHECK (school_year IN ('9ano', '12ano')),
  day_index INTEGER NOT NULL CHECK (day_index > 0 AND day_index <= 60),
  discord_user_id TEXT NOT NULL,
  selected_option TEXT NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (guild_id, school_year, day_index, discord_user_id)
);

CREATE INDEX IF NOT EXISTS discord_exam_challenge_answers_user_idx
  ON discord_exam_challenge_answers (guild_id, discord_user_id);

-- Invite attribution for tie-break points
CREATE TABLE IF NOT EXISTS discord_exam_challenge_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  invited_user_id TEXT NOT NULL,
  inviter_user_id TEXT NOT NULL,
  invite_code TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  points_applied BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (guild_id, invited_user_id)
);

CREATE INDEX IF NOT EXISTS discord_exam_challenge_invites_inviter_idx
  ON discord_exam_challenge_invites (guild_id, inviter_user_id, is_active);
