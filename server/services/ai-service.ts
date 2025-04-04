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
        const apiKey = process.env.GOOGLE_API_KEY

        if (!apiKey) {
          throw new Error("GOOGLE_API_KEY is not defined in environment variables")
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        this.model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-03-25" })
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

  // Format user preferences into a clear, strict instruction
  private formatPreferencesForPrompt(preferences?: {
    style?: string | string[]
    language?: string | string[]
    source?: string | string[]
  }): string {
    let preferencesText = "\n\nSTRICT USER PREFERENCES - YOU MUST FOLLOW THESE EXACTLY:"
    let hasPreferences = false

    // Format style preferences
    if (
      preferences &&
      preferences.style &&
      preferences.style !== "any" &&
      !(Array.isArray(preferences.style) && preferences.style.includes("any"))
    ) {
      const styles = Array.isArray(preferences.style) ? preferences.style : [preferences.style]
      preferencesText += `\n- ONLY recommend music in these styles/genres: ${styles.join(", ")}`
      hasPreferences = true
    }

    // Format language preferences
    if (
      preferences &&
      preferences.language &&
      preferences.language !== "any" &&
      !(Array.isArray(preferences.language) && preferences.language.includes("any"))
    ) {
      const languages = Array.isArray(preferences.language) ? preferences.language : [preferences.language]
      preferencesText += `\n- ONLY recommend songs in these languages: ${languages.join(", ")}`
      hasPreferences = true
    }

    // Format source preferences
    if (
      preferences &&
      preferences.source &&
      preferences.source !== "any" &&
      !(Array.isArray(preferences.source) && preferences.source.includes("any"))
    ) {
      const sources = Array.isArray(preferences.source) ? preferences.source : [preferences.source]
      preferencesText += `\n- ONLY recommend songs from these sources: ${sources.join(", ")}`
      hasPreferences = true
    }

    // Add exclusion for My Hero Academia
    preferencesText += "\n- DO NOT recommend any tracks from My Hero Academia anime or soundtrack"
    hasPreferences = true

    if (hasPreferences) {
      preferencesText +=
        "\n\nIMPORTANT: Do NOT recommend ANY tracks that don't match ALL of the above criteria. If you cannot find enough tracks that match all criteria, recommend fewer tracks rather than including tracks that don't match."
      return preferencesText
    }

    // Even if no other preferences, still exclude My Hero Academia
    return "\n\nSTRICT USER PREFERENCES - YOU MUST FOLLOW THESE EXACTLY:\n- DO NOT recommend any tracks from My Hero Academia anime or soundtrack"
  }

  // Update the createMoodAnalysisPrompt method to accept previouslyRecommendedTracks
  private createMoodAnalysisPrompt(
    moodDescription: string,
    preferences?: { style?: string | string[]; language?: string | string[]; source?: string | string[] },
    previouslyRecommendedTracks?: Array<{ title: string; artist: string }>,
    moodAlignment: "match" | "contrast" = "match",
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
5. Recommend exactly 9 specific music tracks (with artist names) that would be therapeutic for this emotional state`

    // Add mood alignment instruction
    if (moodAlignment === "contrast") {
      promptText += `
IMPORTANT MOOD ALIGNMENT INSTRUCTION: The user has requested music that CONTRASTS with their current mood. If they are feeling negative emotions (sad, anxious, depressed, angry, etc.), recommend uplifting, energetic, and positive music. If they are feeling very energetic or overstimulated, recommend calming and soothing music. The goal is to provide music that helps shift their emotional state in a positive direction.`
    } else {
      promptText += `
IMPORTANT MOOD ALIGNMENT INSTRUCTION: The user has requested music that MATCHES their current mood. Recommend music that resonates with and validates their emotional state.`
    }

    promptText += `
IMPORTANT GUIDELINES FOR MUSIC RECOMMENDATIONS:
- Focus on famous, popular, and well-known songs from 1990s to present day
- Include a mix of recent hits (last 5 years) and classic hits (1990s-2010s)
- For calm/relaxed moods, you may include well-known piano pieces like those by Yiruma or Ludovico Einaudi
- Prioritize songs that have been in the Billboard charts or have high streaming numbers
- Include songs from popular artists like Taylor Swift, Ed Sheeran, Adele, The Weeknd, Billie Eilish, BTS, etc.
- Avoid obscure or unknown artists unless specifically requested
- Each recommendation should be by a different artist if possible
- DO NOT add "Collective", "& Friends", or "Band" to artist names
- Keep artist names simple and accurate (e.g., use "Hatsune Miku" not "Hatsune Miku Collective")
- Use the original artist name without additions (e.g., use "Fujii Kaze" not "Fujii Kaze & Friends")
- Current timestamp: ${timestamp}`

    // Add strict user preferences
    promptText += this.formatPreferencesForPrompt(preferences)

    // Add previously recommended tracks to avoid - with enhanced instructions
    if (previouslyRecommendedTracks && previouslyRecommendedTracks.length > 0) {
      promptText +=
        "\n\nCRITICAL INSTRUCTION: You MUST NOT recommend any of these tracks that were already recommended. Check each of your recommendations against this list and ensure there are NO DUPLICATES:"

      previouslyRecommendedTracks.forEach((track) => {
        promptText += `\n- "${track.title}" by ${track.artist}`
      })

      promptText +=
        "\n\nEven if the tracks are slightly different in spelling or formatting, if they refer to the same song, DO NOT recommend it again. Recommend completely different tracks instead."
    }

    promptText += `

6. Suggest 3-5 music genres that match this emotional state
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
    preferences?: { style?: string | string[]; language?: string | string[]; source?: string | string[] },
    previouslyRecommendedTracks?: Array<{ title: string; artist: string }>,
    moodAlignment: "match" | "contrast" = "match",
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
      const prompt = this.createMoodAnalysisPrompt(
        moodDescription,
        preferences,
        previouslyRecommendedTracks,
        moodAlignment,
      )

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Extract and validate JSON
      const parsedResponse = this.extractJsonFromText(text)

      // Validate against schema
      const validatedResponse = GeminiService.moodAnalysisSchema.parse(parsedResponse)

      // Store the preferences in the response for later reference
      return {
        ...validatedResponse,
        _style: preferences?.style,
        _language: preferences?.language,
        _source: preferences?.source,
        _moodAlignment: moodAlignment,
      }
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

