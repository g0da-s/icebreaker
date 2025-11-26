-- First, drop the existing public_profiles view
DROP VIEW IF EXISTS public.public_profiles CASCADE;

-- Recreate the view without location column
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  avatar_type,
  studies,
  role,
  availability,
  created_at,
  updated_at
FROM public.profiles;

-- Now we can safely drop the location column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS location;