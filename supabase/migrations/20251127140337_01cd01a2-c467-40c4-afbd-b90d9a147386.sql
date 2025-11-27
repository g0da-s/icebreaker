-- Add location column to meetings table
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS calendar_event_id text;