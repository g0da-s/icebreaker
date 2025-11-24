-- Create the user_interests table
CREATE TABLE public.user_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  bio TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_interests
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_interests
CREATE POLICY "Users can view their own interests"
  ON public.user_interests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interests"
  ON public.user_interests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests"
  ON public.user_interests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at on user_interests
CREATE TRIGGER update_user_interests_updated_at
  BEFORE UPDATE ON public.user_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from profiles to user_interests
INSERT INTO public.user_interests (user_id, tags, bio, linkedin_url)
SELECT id, 
       COALESCE(interests, '{}') || COALESCE(expertise, '{}') || COALESCE(skills, '{}'),
       bio,
       linkedin_url
FROM public.profiles
WHERE interests IS NOT NULL OR expertise IS NOT NULL OR skills IS NOT NULL OR bio IS NOT NULL OR linkedin_url IS NOT NULL;

-- Remove columns from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS interests,
  DROP COLUMN IF EXISTS expertise,
  DROP COLUMN IF EXISTS skills,
  DROP COLUMN IF EXISTS bio,
  DROP COLUMN IF EXISTS linkedin_url;