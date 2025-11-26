-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view other users basic profile info" ON profiles;

-- Create a policy for users to view their own full profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Create a view for public profile information (excludes sensitive PII)
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  avatar_type,
  studies,
  role,
  location,
  availability,
  created_at,
  updated_at
FROM profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public_profiles TO authenticated;

-- Add RLS to the view
ALTER VIEW public_profiles SET (security_invoker = true);