-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  music_style TEXT[] DEFAULT ARRAY['any'],
  music_language TEXT[] DEFAULT ARRAY['any'],
  music_source TEXT[] DEFAULT ARRAY['any'],
  default_mood_alignment TEXT NOT NULL DEFAULT 'match',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Removed updated_at column
  UNIQUE(user_id)
);

-- Add RLS policies for user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for selecting user's own preferences
CREATE POLICY select_own_preferences ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for inserting user's own preferences
CREATE POLICY insert_own_preferences ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating user's own preferences
CREATE POLICY update_own_preferences ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for deleting user's own preferences
CREATE POLICY delete_own_preferences ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

