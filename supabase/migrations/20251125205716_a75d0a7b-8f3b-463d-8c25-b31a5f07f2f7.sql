-- Add column to store pre-selected questions for each meeting
ALTER TABLE public.meetings
ADD COLUMN selected_questions JSONB DEFAULT NULL;