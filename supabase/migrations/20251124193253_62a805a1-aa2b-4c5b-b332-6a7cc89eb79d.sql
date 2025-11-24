-- Update meetings table to match requirements
ALTER TABLE public.meetings 
  RENAME COLUMN user1_id TO requester_id;

ALTER TABLE public.meetings 
  RENAME COLUMN user2_id TO recipient_id;

ALTER TABLE public.meetings 
  RENAME COLUMN meeting_time TO scheduled_at;

-- Update RLS policies to use new column names
DROP POLICY IF EXISTS "Users can create meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can view their own meetings" ON public.meetings;

CREATE POLICY "Users can create meetings"
  ON public.meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can view their own meetings"
  ON public.meetings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can update meetings they're involved in"
  ON public.meetings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);