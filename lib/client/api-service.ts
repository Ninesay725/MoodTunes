import type { MoodAnalysis, Track, MusicPreferences } from "@/server/types"

// Client-side API service for interacting with the backend
export class ApiService {
  // Analyze mood using the server action
  static async analyzeMood(
    moodDescription: string,
    preferences?: MusicPreferences,
    previouslyRecommendedTracks?: Array<{ title: string; artist: string }>,
    moodAlignment: "match" | "contrast" = "match",
  ): Promise<MoodAnalysis> {
    try {
      // Format preferences for the API - properly handle arrays
      const formattedPreferences = preferences
        ? {
            style: preferences.style.includes("any") ? "any" : preferences.style,
            language: preferences.language.includes("any") ? "any" : preferences.language,
            source: preferences.source.includes("any") ? "any" : preferences.source,
          }
        : undefined

      // Call the mood analysis API endpoint
      const response = await fetch("/api/mood/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moodDescription,
          preferences: formattedPreferences,
          previouslyRecommendedTracks,
          moodAlignment,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze mood")
      }

      return await response.json()
    } catch (error) {
      console.error("Error analyzing mood:", error)
      throw error
    }
  }

  // Get music recommendations based on mood analysis
  static async getRecommendations(moodAnalysis: MoodAnalysis): Promise<Track[]> {
    try {
      // Validate the mood analysis object before sending
      if (
        !moodAnalysis ||
        !moodAnalysis.musicRecommendations ||
        !Array.isArray(moodAnalysis.musicRecommendations.recommendedTracks)
      ) {
        throw new Error("Invalid mood analysis data. Missing required fields.")
      }

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(moodAnalysis),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch recommendations")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      throw error
    }
  }

  // Save mood entry to local storage (in a real app, this would be a database)
  static saveMoodEntry(entry: Omit<MoodEntry, "id" | "timestamp">): string {
    try {
      const moodHistory = JSON.parse(localStorage.getItem("moodHistory") || "[]")
      const timestamp = Date.now()
      const entryId = timestamp.toString()

      const newEntry = {
        ...entry,
        id: entryId,
        timestamp,
      }

      moodHistory.push(newEntry)
      localStorage.setItem("moodHistory", JSON.stringify(moodHistory))

      return entryId
    } catch (error) {
      console.error("Error saving mood entry:", error)
      throw error
    }
  }

  // Get mood entry by ID from local storage
  static getMoodEntryById(id: string): MoodEntry | null {
    try {
      const moodHistory = JSON.parse(localStorage.getItem("moodHistory") || "[]")
      return moodHistory.find((entry: MoodEntry) => entry.id === id) || null
    } catch (error) {
      console.error("Error getting mood entry:", error)
      return null
    }
  }

  // Get all mood entries from local storage
  static getAllMoodEntries(): MoodEntry[] {
    try {
      return JSON.parse(localStorage.getItem("moodHistory") || "[]")
    } catch (error) {
      console.error("Error getting mood entries:", error)
      return []
    }
  }

  // Enhanced track normalization function
  static normalizeTrackInfo(title: string, artist: string): string {
    if (!title || !artist) return ""

    // Convert to lowercase, trim whitespace, and normalize spaces
    const normalizedTitle = title.toLowerCase().trim().replace(/\s+/g, " ")
    const normalizedArtist = artist.toLowerCase().trim().replace(/\s+/g, " ")

    // Remove common features indicators that might cause false non-matches
    const cleanTitle = normalizedTitle
      .replace(/$$feat\..*?$$/g, "")
      .replace(/$$ft\..*?$$/g, "")
      .replace(/$$featuring.*?$$/g, "")
      .replace(/$$with.*?$$/g, "")
      .replace(/\[.*?\]/g, "")
      .trim()

    const cleanArtist = normalizedArtist.replace(/feat\.|ft\.|featuring/g, "").trim()

    return `${cleanTitle} - ${cleanArtist}`
  }

  // Use this function to check for duplicates
  static isTrackAlreadyRecommended(
    title: string,
    artist: string,
    existingTracks: Array<{ title: string; artist: string }>,
  ): boolean {
    const normalizedTrack = this.normalizeTrackInfo(title, artist)
    if (!normalizedTrack) return false

    return existingTracks.some((track) => {
      const existingNormalized = this.normalizeTrackInfo(track.title, track.artist)
      return normalizedTrack === existingNormalized
    })
  }
}

// Types for client-side use
interface MoodEntry {
  id: string
  date: string
  description: string
  analysis: MoodAnalysis
  timestamp: number
  moodAlignment?: "match" | "contrast"
}

