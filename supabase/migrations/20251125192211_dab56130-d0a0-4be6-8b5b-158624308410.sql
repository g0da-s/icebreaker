-- Enable realtime for meetings table to sync stage updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;