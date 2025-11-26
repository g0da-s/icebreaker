-- Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view without SECURITY DEFINER property
-- This view exposes only non-sensitive profile fields
CREATE VIEW public.public_profiles AS
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