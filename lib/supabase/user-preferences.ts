import { getSupabaseClient } from "./client"

export type UserPreferences = {
  id: string
  user_id: string
  music_style: string[]
  music_language: string[]
  music_source: string[]
  default_mood_alignment: "match" | "contrast"
  created_at: string
  updated_at?: string // Make updated_at optional
}

export type UpdatePreferencesInput = {
  music_style?: string[]
  music_language?: string[]
  music_source?: string[]
  default_mood_alignment?: "match" | "contrast"
}

// Update the getUserPreferences function to remove updated_at
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const supabase = getSupabaseClient()

    // Check if preferences exist
    const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching user preferences:", error)
      return null
    }

    // If preferences don't exist, create default preferences
    if (!data) {
      const defaultPreferences = {
        user_id: userId,
        music_style: ["any"],
        music_language: ["any"],
        music_source: ["any"],
        default_mood_alignment: "match" as const,
        created_at: new Date().toISOString(),
        // Removed updated_at
      }

      const { data: newData, error: createError } = await supabase
        .from("user_preferences")
        .insert(defaultPreferences)
        .select()
        .single()

      if (createError) {
        console.error("Error creating default user preferences:", createError)
        return null
      }

      return newData as UserPreferences
    }

    return data as UserPreferences
  } catch (error) {
    console.error("Error in getUserPreferences:", error)
    return null
  }
}

// Update the updateUserPreferences function to remove updated_at
export const updateUserPreferences = async (
  userId: string,
  updates: UpdatePreferencesInput,
): Promise<UserPreferences | null> => {
  try {
    const supabase = getSupabaseClient()

    // First check if preferences exist
    const { data: existingPrefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    // If preferences don't exist, create them
    if (!existingPrefs) {
      const defaultPreferences = {
        user_id: userId,
        music_style: updates.music_style || ["any"],
        music_language: updates.music_language || ["any"],
        music_source: updates.music_source || ["any"],
        default_mood_alignment: updates.default_mood_alignment || "match",
        created_at: new Date().toISOString(),
        // Removed updated_at
      }

      const { data: newData, error: createError } = await supabase
        .from("user_preferences")
        .insert(defaultPreferences)
        .select()
        .single()

      if (createError) {
        console.error("Error creating user preferences:", createError)
        return null
      }

      return newData as UserPreferences
    }

    // Otherwise, update existing preferences
    const updateData: any = {}

    if (updates.music_style !== undefined) {
      updateData.music_style = updates.music_style
    }

    if (updates.music_language !== undefined) {
      updateData.music_language = updates.music_language
    }

    if (updates.music_source !== undefined) {
      updateData.music_source = updates.music_source
    }

    if (updates.default_mood_alignment !== undefined) {
      updateData.default_mood_alignment = updates.default_mood_alignment
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating user preferences:", error)
      return null
    }

    return data as UserPreferences
  } catch (error) {
    console.error("Error in updateUserPreferences:", error)
    return null
  }
}

