import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai"
import { z } from "zod"

// Define a class for handling Gemini API interactions
export class GeminiService {
  private model: GenerativeModel | null = null
  private static instance: GeminiService
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null

  private constructor() {
    // Initialize will be called separately
  }

  // Singleton pattern to ensure only one instance of the service
  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService()
    }
    return GeminiService.instance
  }

  // Initialize the service with the API key
  private async initialize() {
    if (this.isInitialized) return

    if (this.initializationPromise) {
      await this.initializationPromise
      return
    }

    this.initializationPromise = (async () => {
      try {
        // Try to get the API key from environment first (for server-side)
        let apiKey = process.env.GOOGLE_API_KEY

        // If not available (client-side), fetch from our API endpoint
        if (!apiKey) {
          const response = await fetch("/api/auth/google-api")
          if (!response.ok) {
            throw new Error("Failed to fetch Google API key")
          }
          const data = await response.json()
          apiKey = data.apiKey
        }

        if (!apiKey) {
          throw new Error("GOOGLE_API_KEY is not defined in environment variables")
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
        this.isInitialized = true
      } catch (error) {
        console.error("Failed to initialize GeminiService:", error)
        throw error
      }
    })()

    await this.initializationPromise
  }

  // Define the schema for mood analysis and music recommendations
  private static moodAnalysisSchema = z.object({
    moodAnalysis: z.string().describe("A detailed analysis of the user's mood based on their description"),
    primaryMood: z.string().describe("A single word that best describes the primary mood"),
    // Fix: Allow null values and transform them to undefined
    secondaryMood: z
      .string()
      .nullable()
      .transform((val) => (val === null ? undefined : val))
      .optional()
      .describe("A single word that describes a secondary mood, if present"),
    intensity: z.number().min(1).max(10).describe("The intensity of the emotion on a scale of 1-10"),
    musicRecommendations: z.object({
      genres: z.array(z.string()).describe("3-5 music genres that match the emotional state"),
      recommendedTracks: z
        .array(
          z.object({
            title: z.string().describe("The title of the recommended track"),
            artist: z.string().describe("The artist who performed the track"),
          }),
        )
        .min(5)
        .max(10)
        .describe("5-10 specific track recommendations that match the mood"),
      playlistMood: z.string().describe("A descriptive phrase for the overall mood of the playlist"),
      tempo: z.string().describe("The recommended tempo for music (slow, medium, upbeat)"),
    }),
  })

  // Update the createMoodAnalysisPrompt method to accept previouslyRecommendedTracks
  private createMoodAnalysisPrompt(
    moodDescription: string,
    preferences?: { style?: string; language?: string; source?: string },
    previouslyRecommendedTracks?: Array<{ title: string; artist: string }>,
  ): string {
    // Remove the random seeds since we're using a different approach
    const timestamp = new Date().toISOString()

    let promptText = `You are an expert music therapist and emotional analyst. Analyze the following mood description and provide appropriate music recommendations:

"${moodDescription}"

Based on this description:
1. Analyze the user's emotional state in detail (2-3 sentences)
2. Identify the primary mood in a single word
3. Identify any secondary mood in a single word (if present, otherwise set to null)
4. Rate the emotional intensity on a scale of 1-10
5. Recommend exactly 9 specific music tracks (with artist names) that would be therapeutic for this emotional state
 IMPORTANT GUIDELINES FOR MUSIC RECOMMENDATIONS:
 - Focus on famous, popular, and well-known songs from 1990s to present day
 - Include a mix of recent hits (last 5 years) and classic hits (2000s-2020s)
 - Prioritize songs that have been in the Billboard charts or have high streaming numbers
 - Avoid obscure or unknown artists unless specifically requested
 - Each recommendation should be by a different artist if possible
 - DO NOT add "Collective", "& Friends", or "Band" to artist names
 - Keep artist names simple and accurate (e.g., use "Hatsune Miku" not "Hatsune Miku Collective")
 - Use the original artist name without additions (e.g., use "Fujii Kaze" not "Fujii Kaze & Friends")
 - Current timestamp: ${timestamp}`

    // Add previously recommended tracks to avoid
    if (previouslyRecommendedTracks && previouslyRecommendedTracks.length > 0) {
      promptText += "\n\nIMPORTANT: Do NOT recommend any of these tracks that were already recommended:"
      previouslyRecommendedTracks.forEach((track) => {
        promptText += `\n- "${track.title}" by ${track.artist}`
      })
      promptText += "\nRecommend completely different tracks instead."
    }

    // Add user preferences to the prompt if provided
    if (preferences) {
      promptText += "\n\nAdditional preferences:"

      if (preferences.style && preferences.style !== "any") {
        promptText += `\n- Focus on ${preferences.style} music style and genre`
      }

      if (preferences.language && preferences.language !== "any") {
        promptText += `\n- Recommend songs in ${preferences.language} language`
      }

      if (preferences.source && preferences.source !== "any") {
        promptText += `\n- Include songs from ${preferences.source} soundtracks if possible`
      }
    }

    promptText += `\n\n6. Suggest 3-5 music genres that match this emotional state
7. Describe the overall mood of the playlist in a phrase
8. Recommend a tempo (slow, medium, or upbeat)

IMPORTANT: Respond ONLY with a valid JSON object in the following format with no additional text:
{
"moodAnalysis": "detailed analysis of the mood",
"primaryMood": "single word primary mood",
"secondaryMood": "single word secondary mood or null if none",
"intensity": number between 1-10,
"musicRecommendations": {
  "genres": ["genre1", "genre2", "genre3"],
  "recommendedTracks": [
    {
      "title": "track title 1",
      "artist": "artist name 1"
    },
    {
      "title": "track title 2",
      "artist": "artist name 2"
    }
    // 3-8 more tracks
  ],
  "playlistMood": "descriptive phrase for the playlist mood",
  "tempo": "slow/medium/upbeat"
}
}`

    return promptText
  }

  // Method to extract JSON from a potentially mixed text response
  private extractJsonFromText(text: string): object {
    try {
      // Try to parse the entire text as JSON first
      return JSON.parse(text)
    } catch (e) {
      // If that fails, try to extract a JSON object using regex
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Failed to extract JSON from Gemini response")
      }
      try {
        return JSON.parse(jsonMatch[0])
      } catch (e) {
        throw new Error("Extracted text is not valid JSON")
      }
    }
  }

  // Update the analyzeMood method to accept previouslyRecommendedTracks
  public async analyzeMood(
    moodDescription: string,
    preferences?: { style?: string; language?: string; source?: string },
    previouslyRecommendedTracks?: Array<{ title: string; artist: string }>,
  ) {
    if (!moodDescription || moodDescription.trim() === "") {
      throw new Error("Mood description cannot be empty")
    }

    try {
      // Ensure the service is initialized
      await this.initialize()

      if (!this.model) {
        throw new Error("Gemini model is not initialized")
      }

      // Create prompt with user preferences and send to Gemini
      const prompt = this.createMoodAnalysisPrompt(moodDescription, preferences, previouslyRecommendedTracks)

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Extract and validate JSON
      const parsedResponse = this.extractJsonFromText(text)

      // Validate against schema
      return GeminiService.moodAnalysisSchema.parse(parsedResponse)
    } catch (error) {
      console.error("Error analyzing mood with Gemini:", error)

      if (error instanceof z.ZodError) {
        throw new Error("Invalid response format from Gemini API: " + JSON.stringify(error.errors, null, 2))
      }

      // Re-throw the error for the caller to handle
      throw error
    }
  }
}

// Create a function to get mood analysis that uses the GeminiService
export async function analyzeMood(
  moodDescription: string,
  preferences?: { style?: string; language?: string; source?: string },
) {
  try {
    const geminiService = GeminiService.getInstance()
    return await geminiService.analyzeMood(moodDescription, preferences)
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

