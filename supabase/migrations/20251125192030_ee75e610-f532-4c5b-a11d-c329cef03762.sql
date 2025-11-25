-- Add connected_interest column to store the shared interest that caused the match
ALTER TABLE meetings ADD COLUMN connected_interest text;

-- Add current_stage column to track ice-breaker progress
ALTER TABLE meetings ADD COLUMN current_stage integer DEFAULT 1;