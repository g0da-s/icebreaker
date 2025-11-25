-- Modify the handle_new_user function to also unlock the welcome achievement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
  welcome_achievement_id uuid;
BEGIN
  -- Determine role based on email domain
  IF new.email LIKE '%@stud.ism.lt' THEN
    user_role := 'student';
  ELSIF new.email LIKE '%@faculty.ism.lt' THEN
    user_role := 'faculty';
  ELSIF new.email LIKE '%@ism.lt' THEN
    user_role := 'staff';
  ELSE
    user_role := 'staff';
  END IF;

  -- Insert profile with auto-assigned role
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    user_role
  );

  -- Get the welcome achievement ID
  SELECT id INTO welcome_achievement_id
  FROM achievement_definitions
  WHERE slug = 'welcome_newcomer'
  LIMIT 1;

  -- Automatically unlock the welcome achievement
  IF welcome_achievement_id IS NOT NULL THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (new.id, welcome_achievement_id);
  END IF;

  RETURN new;
END;
$$;