import { getSupabaseClient } from "./client"

const AVATAR_BUCKET = "avatars"
const MOOD_IMAGES_BUCKET = "mood-images"

// Upload an avatar image
export const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
  try {
    // Create form data for the upload
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)
    formData.append("bucket", AVATAR_BUCKET)

    // Send the request to the API route
    const response = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error uploading avatar:", errorData.error)
      return null
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error("Error in uploadAvatar:", error)
    return null
  }
}

// Delete an avatar image
export const deleteAvatar = async (userId: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()

    // List files to find the avatar
    const { data: files, error: listError } = await supabase.storage.from(AVATAR_BUCKET).list(userId)

    if (listError) {
      // If the bucket doesn't exist, we consider it a success (nothing to delete)
      if (listError.message.includes("bucket not found")) {
        return true
      }
      console.error("Error listing files:", listError)
      return false
    }

    if (!files || files.length === 0) {
      return true // No files to delete
    }

    // Delete all files in the user's folder
    const filePaths = files.map((file) => `${userId}/${file.name}`)
    const { error } = await supabase.storage.from(AVATAR_BUCKET).remove(filePaths)

    if (error) {
      console.error("Error deleting avatar:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteAvatar:", error)
    return false
  }
}

// Upload a mood image
export const uploadMoodImage = async (file: File, userId: string, moodEntryId: string): Promise<string | null> => {
  try {
    // Create form data for the upload
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)
    formData.append("bucket", MOOD_IMAGES_BUCKET)
    formData.append("path", `${userId}/${moodEntryId}`)

    // Send the request to the API route
    const response = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error uploading mood image:", errorData.error)
      return null
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error("Error in uploadMoodImage:", error)
    return null
  }
}

// Delete a mood image
export const deleteMoodImage = async (userId: string, moodEntryId: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()

    // List files to find the mood images
    const { data: files, error: listError } = await supabase.storage
      .from(MOOD_IMAGES_BUCKET)
      .list(`${userId}/${moodEntryId}`)

    if (listError) {
      // If the bucket doesn't exist, we consider it a success (nothing to delete)
      if (listError.message.includes("bucket not found")) {
        return true
      }
      console.error("Error listing files:", listError)
      return false
    }

    if (!files || files.length === 0) {
      return true // No files to delete
    }

    // Delete all files in the mood entry folder
    const filePaths = files.map((file) => `${userId}/${moodEntryId}/${file.name}`)
    const { error } = await supabase.storage.from(MOOD_IMAGES_BUCKET).remove(filePaths)

    if (error) {
      console.error("Error deleting mood images:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteMoodImage:", error)
    return false
  }
}

// Get a list of all files in a bucket for a user
export const listUserFiles = async (userId: string, bucket: string, path?: string): Promise<string[] | null> => {
  try {
    const supabase = getSupabaseClient()

    const listPath = path ? `${userId}/${path}` : userId

    const { data, error } = await supabase.storage.from(bucket).list(listPath)

    if (error) {
      console.error(`Error listing files in ${bucket}:`, error)
      return null
    }

    if (!data || data.length === 0) {
      return []
    }

    // Get public URLs for all files
    const fileUrls = data.map((file) => {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(`${listPath}/${file.name}`)

      return urlData.publicUrl
    })

    return fileUrls
  } catch (error) {
    console.error(`Error in listUserFiles for ${bucket}:`, error)
    return null
  }
}

