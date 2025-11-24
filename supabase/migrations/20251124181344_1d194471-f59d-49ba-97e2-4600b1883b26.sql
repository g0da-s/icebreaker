-- Add new columns to profiles table for enhanced onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS studies TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS avatar_type TEXT CHECK (avatar_type IN ('upload', 'mascot')),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_answers JSONB DEFAULT '{}'::jsonb;