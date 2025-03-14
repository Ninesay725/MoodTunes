"use server"

import { getSoundCloudRecommendations } from "../services/soundcloud-service"
import type { MoodAnalysis, Track } from "../types"

// Helper function to log track information
function logTrackInfo(tracks: Track[], label: string) {
  console.log(`--- ${label} (${tracks.length} tracks) ---`)
  tracks.forEach((track, index) => {
    console.log(`${index + 1}. "${track.name}" by ${track.artist} (source: ${track.source})`)
  })
  console.log("------------------------")
}

export async function getRecommendations(moodAnalysis: MoodAnalysis): Promise<{ tracks: Track[]; error?: string }> {
  try {
    // Validate the mood analysis object
    if (
      !moodAnalysis ||
      !moodAnalysis.musicRecommendations ||
      !Array.isArray(moodAnalysis.musicRecommendations.recommendedTracks)
    ) {
      console.error("Invalid mood analysis data:", moodAnalysis)
      return {
        tracks: [],
        error: "Invalid mood analysis data. Missing required fields.",
      }
    }

    // Log the requested tracks from Gemini
    console.log("Gemini recommended tracks:")
    moodAnalysis.musicRecommendations.recommendedTracks.forEach((track, index) => {
      console.log(`${index + 1}. "${track.title}" by ${track.artist}`)
    })

    const recommendations = await getSoundCloudRecommendations(moodAnalysis)

    // Log the tracks we found on SoundCloud
    logTrackInfo(recommendations, "Tracks found (including placeholders)")

    // Count how many tracks were not found on SoundCloud
    const notFoundCount = recommendations.filter((track) => track.source === "none").length
    if (notFoundCount > 0) {
      console.log(
        `${notFoundCount} tracks were not found on SoundCloud but will be displayed with Google search option`,
      )
    }

    // If we didn't get any recommendations at all, return a clear error
    if (!recommendations || recommendations.length === 0) {
      return {
        tracks: [],
        error: "No tracks found matching your preferences. Try different options.",
      }
    }

    return { tracks: recommendations }
  } catch (error) {
    console.error("Error in getRecommendations:", error)
    return {
      tracks: [],
      error: error instanceof Error ? error.message : "Failed to get recommendations",
    }
  }
}

