-- Create mood_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  analysis JSONB NOT NULL,
  mood_alignment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for mood_entries
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- Policy for selecting user's own mood entries
CREATE POLICY select_own_mood_entries ON public.mood_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for inserting user's own mood entries
CREATE POLICY insert_own_mood_entries ON public.mood_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating user's own mood entries
CREATE POLICY update_own_mood_entries ON public.mood_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for deleting user's own mood entries
CREATE POLICY delete_own_mood_entries ON public.mood_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS mood_entries_user_id_idx ON public.mood_entries(user_id);

-- Create index on date for faster calendar queries
CREATE INDEX IF NOT EXISTS mood_entries_date_idx ON public.mood_entries(date);

