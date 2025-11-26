-- Add ai_summary column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.ai_summary IS 'AI-generated user story based on onboarding chat answers';