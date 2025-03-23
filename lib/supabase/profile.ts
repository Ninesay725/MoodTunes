import { getSupabaseClient } from "./client"
import { uploadAvatar } from "./storage"

export type Profile = {
  id: string
  username: string
  avatar_url: string
  created_at: string
  updated_at: string
}

// Get a user's profile
export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    return data as Profile
  } catch (error) {
    console.error("Error in getProfile:", error)
    return null
  }
}

// Update a user's profile
export const updateProfile = async (
  userId: string,
  updates: { username?: string; avatar_file?: File },
): Promise<{ success: boolean; profile?: Profile; error?: string }> => {
  try {
    const supabase = getSupabaseClient()

    // First check if the profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle() // Use maybeSingle instead of single to avoid errors if no profile exists

    if (fetchError) {
      console.error("Error fetching profile before update:", fetchError)
      return {
        success: false,
        error: "Failed to fetch profile before update",
      }
    }

    // If profile doesn't exist, return an error
    if (!existingProfile) {
      return {
        success: false,
        error: "Profile not found",
      }
    }

    // Prepare updates object
    const profileUpdates: { username?: string; avatar_url?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    }

    if (updates.username) {
      profileUpdates.username = updates.username
    }

    // If there's a new avatar file, upload it
    if (updates.avatar_file) {
      const avatarUrl = await uploadAvatar(updates.avatar_file, userId)
      if (avatarUrl) {
        profileUpdates.avatar_url = avatarUrl
      } else {
        // If avatar upload failed but we still have a username update, continue
        // Otherwise return an error
        if (!updates.username) {
          return {
            success: false,
            error: "Failed to upload avatar image",
          }
        }
      }
    }

    // Update the profile
    const { data, error } = await supabase.from("profiles").update(profileUpdates).eq("id", userId).select()

    if (error) {
      console.error("Error updating profile:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Check if we got data back
    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Profile update returned no data",
      }
    }

    return {
      success: true,
      profile: data[0] as Profile,
    }
  } catch (error) {
    console.error("Error in updateProfile:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

