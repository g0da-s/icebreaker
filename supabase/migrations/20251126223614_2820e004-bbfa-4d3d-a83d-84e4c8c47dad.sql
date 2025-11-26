-- Drop the existing view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view with SECURITY INVOKER mode enabled
-- This ensures the view respects RLS policies and uses the querying user's permissions
CREATE VIEW public.public_profiles
WITH (security_invoker=on)
AS
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