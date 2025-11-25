-- Create function to automatically grant welcome badge to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at)
  VALUES (
    NEW.id,
    (SELECT id FROM public.achievement_definitions WHERE slug = 'welcome'),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create trigger to execute function after profile creation
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_badge();