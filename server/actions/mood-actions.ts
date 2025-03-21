"use server"

import { GeminiService } from "../services/ai-service"
import type { MoodAnalysis } from "../types"

export async function analyzeMood(
  moodDescription: string,
  preferences?: { style?: string | string[]; language?: string | string[]; source?: string | string[] },
  previouslyRecommendedTracks?: Array<{ title: string; artist: string }>,
  moodAlignment: "match" | "contrast" = "match",
): Promise<MoodAnalysis> {
  try {
    const geminiService = GeminiService.getInstance()
    return await geminiService.analyzeMood(moodDescription, preferences, previouslyRecommendedTracks, moodAlignment)
  } catch (error) {
    console.error("Error in analyzeMood:", error)

    // Provide a fallback response with a clear error message
    return {
      moodAnalysis: "We couldn't analyze your mood at this time.",
      primaryMood: "unknown",
      intensity: 5,
      error: error instanceof Error ? error.message : "Unknown error",
      musicRecommendations: {
        genres: ["pop", "ambient", "indie"],
        recommendedTracks: [
          { title: "Blinding Lights", artist: "The Weeknd" },
          { title: "Levitating", artist: "Dua Lipa" },
          { title: "As It Was", artist: "Harry Styles" },
          { title: "Easy On Me", artist: "Adele" },
          { title: "Dynamite", artist: "BTS" },
        ],
        playlistMood: "Balanced and contemporary",
        tempo: "medium",
      },
    }
  }
}

