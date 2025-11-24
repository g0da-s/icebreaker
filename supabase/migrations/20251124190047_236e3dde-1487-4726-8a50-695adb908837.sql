-- Change age column to birth_date in profiles table
ALTER TABLE public.profiles 
DROP COLUMN age,
ADD COLUMN birth_date date;

-- Add availability column to profiles table
ALTER TABLE public.profiles
ADD COLUMN availability jsonb DEFAULT '{}'::jsonb;