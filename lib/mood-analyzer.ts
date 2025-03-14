import { GeminiService } from "@/lib/ai-service"

export async function analyzeMood(
  moodDescription: string,
  preferences?: { style?: string; language?: string; source?: string },
  previouslyRecommendedTracks?: Array<{ title: string; artist: string }>,
) {
  const geminiService = GeminiService.getInstance()
  return await geminiService.analyzeMood(moodDescription, preferences, previouslyRecommendedTracks)
}

