import { getSupabaseClient } from "./client"
import type { MoodAnalysis } from "@/server/types"

export type MoodEntry = {
  id: string
  user_id: string
  date: string
  description: string
  analysis: MoodAnalysis
  mood_alignment?: "match" | "contrast"
  created_at: string
  updated_at?: string // Make updated_at optional
}

export type CreateMoodEntryInput = {
  date: string
  description: string
  analysis: MoodAnalysis
  mood_alignment?: "match" | "contrast"
}

export type UpdateMoodEntryInput = {
  description?: string
  mood_alignment?: "match" | "contrast"
}

// Save a mood entry to the database
export const saveMoodEntry = async (userId: string, entry: CreateMoodEntryInput): Promise<{ id: string } | null> => {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("mood_entries")
      .insert({
        user_id: userId,
        date: entry.date, // This is already in local timezone YYYY-MM-DD format
        description: entry.description,
        analysis: entry.analysis,
        mood_alignment: entry.mood_alignment,
        created_at: new Date().toISOString(),
        // Removed updated_at field
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error saving mood entry:", error)
      return null
    }

    return { id: data.id }
  } catch (error) {
    console.error("Error in saveMoodEntry:", error)
    return null
  }
}

// Get a mood entry by ID
export const getMoodEntryById = async (userId: string, entryId: string): Promise<MoodEntry | null> => {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("id", entryId)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching mood entry:", error)
      return null
    }

    return data as MoodEntry
  } catch (error) {
    console.error("Error in getMoodEntryById:", error)
    return null
  }
}

// Get all mood entries for a user
export const getAllMoodEntries = async (userId: string): Promise<MoodEntry[]> => {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching mood entries:", error)
      return []
    }

    return data as MoodEntry[]
  } catch (error) {
    console.error("Error in getAllMoodEntries:", error)
    return []
  }
}

// Get mood entries for a specific date range
export const getMoodEntriesByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<MoodEntry[]> => {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching mood entries by date range:", error)
      return []
    }

    return data as MoodEntry[]
  } catch (error) {
    console.error("Error in getMoodEntriesByDateRange:", error)
    return []
  }
}

// Update a mood entry
export const updateMoodEntry = async (
  userId: string,
  entryId: string,
  updates: UpdateMoodEntryInput,
): Promise<MoodEntry | null> => {
  try {
    const supabase = getSupabaseClient()

    // Prepare the update object without updated_at
    const updateData: any = {}

    if (updates.description !== undefined) {
      updateData.description = updates.description
    }

    if (updates.mood_alignment !== undefined) {
      updateData.mood_alignment = updates.mood_alignment
    }

    const { data, error } = await supabase
      .from("mood_entries")
      .update(updateData)
      .eq("id", entryId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating mood entry:", error)
      return null
    }

    return data as MoodEntry
  } catch (error) {
    console.error("Error in updateMoodEntry:", error)
    return null
  }
}

// Delete a mood entry
export const deleteMoodEntry = async (userId: string, entryId: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.from("mood_entries").delete().eq("id", entryId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting mood entry:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteMoodEntry:", error)
    return false
  }
}

