-- Allow users to view basic profile information of other users for matching
CREATE POLICY "Users can view other users basic profile info"
ON public.profiles
FOR SELECT
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;