-- Create achievement_definitions table
CREATE TABLE public.achievement_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_locked_url TEXT NOT NULL,
  image_unlocked_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievement_definitions (everyone can view all achievements)
CREATE POLICY "Anyone can view achievement definitions"
ON public.achievement_definitions
FOR SELECT
USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert initial achievement definitions
INSERT INTO public.achievement_definitions (slug, title, description, image_locked_url, image_unlocked_url) VALUES
('first_meeting', 'Ice Breaker', 'Completed your first meeting', '/achievements/first-locked.png', '/achievements/first-unlocked.png'),
('five_meetings', 'Social Butterfly', 'Completed 5 meetings', '/achievements/second-locked.png', '/achievements/second-unlocked.png'),
('ten_meetings', 'Networker', 'Completed 10 meetings', '/achievements/third-locked.png', '/achievements/third-unlocked.png'),
('twenty_meetings', 'Community Leader', 'Completed 20 meetings', '/achievements/forth-locked.png', '/achievements/forth-unlocked.png'),
('fifty_meetings', 'Connection Master', 'Completed 50 meetings', '/achievements/fifth-locked.png', '/achievements/fifth-unlocked.png');