-- Drop the restrictive policy that only allows users to view their own interests
DROP POLICY IF EXISTS "Users can view their own interests" ON public.user_interests;

-- Create a new policy that allows all authenticated users to view interests and bio
CREATE POLICY "Users can view others interests and bio"
ON public.user_interests
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Keep the insert and update policies restrictive (users can only modify their own data)
-- These policies already exist and are correct