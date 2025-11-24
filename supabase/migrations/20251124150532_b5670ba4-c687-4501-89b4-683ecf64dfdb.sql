-- Add profile fields for interests, expertise, skills, etc.
alter table public.profiles
  add column if not exists interests text[],
  add column if not exists expertise text[],
  add column if not exists skills text[],
  add column if not exists linkedin_url text,
  add column if not exists bio text;