-- Allow authenticated users to view all profiles (public_profiles view already filters sensitive data)
CREATE POLICY "Authenticated users can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);