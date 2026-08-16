-- Create tables for Nutrapp: profiles, logs, deficits
-- Run this in the Supabase SQL Editor for your project (https://app.supabase.com > SQL Editor)

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY,
  data jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Logs table (store daily logs as JSONB keyed by date)
CREATE TABLE IF NOT EXISTS public.logs (
  user_id uuid PRIMARY KEY,
  data jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Deficits table (map of date->deficit number)
CREATE TABLE IF NOT EXISTS public.deficits (
  user_id uuid PRIMARY KEY,
  data jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security and create owner-only policies
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_owner') THEN
    CREATE POLICY profiles_owner ON public.profiles
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.logs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'logs' AND policyname = 'logs_owner') THEN
    CREATE POLICY logs_owner ON public.logs
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.deficits ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'deficits' AND policyname = 'deficits_owner') THEN
    CREATE POLICY deficits_owner ON public.deficits
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Optional: Grant the anon role permission to call RPCs if needed, but RLS will restrict access
-- Note: If you need server-side inserts from a service role, use the SUPABASE_SERVICE_ROLE_KEY.
