-- Add double confirmation columns to meetings table
ALTER TABLE public.meetings
ADD COLUMN requester_completed BOOLEAN DEFAULT false,
ADD COLUMN recipient_completed BOOLEAN DEFAULT false;