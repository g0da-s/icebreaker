-- Create meetings table
CREATE TABLE public.meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_time timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  meeting_type text NOT NULL CHECK (meeting_type IN ('friendly', 'mentor', 'cofounder', 'explore')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user availability table
CREATE TABLE public.user_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week, start_time)
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
CREATE POLICY "Users can view their own meetings"
ON public.meetings FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create meetings"
ON public.meetings FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own meetings"
ON public.meetings FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for user_availability
CREATE POLICY "Users can view their own availability"
ON public.user_availability FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own availability"
ON public.user_availability FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability"
ON public.user_availability FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability"
ON public.user_availability FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_availability_updated_at
BEFORE UPDATE ON public.user_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();