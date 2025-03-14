// SoundCloud API integration for MoodTunes
import { z } from "zod"

// Types
export interface MoodAnalysis {
  moodAnalysis: string
  primaryMood: string
  secondaryMood?: string
  intensity: number
  musicRecommendations: {
    genres: string[]
    recommendedTracks: {
      title: string
      artist: string
    }[]
    playlistMood: string
    tempo: string
  }
  error?: string
  _randomSeed?: number | string
  _style?: string
  _language?: string
  _source?: string
}

export interface Track {
  id: string
  name: string
  artist: string
  albumCover: string
  previewUrl: string | null
  soundcloudUrl: string
  embedUrl: string
  source: "soundcloud" | "none"
}

// Schema for SoundCloud API responses
const soundcloudTokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
  token_type: z.string(),
})

const soundcloudTrackSchema = z.object({
  id: z.number(),
  title: z.string(),
  permalink_url: z.string(),
  user: z.object({
    username: z.string(),
    avatar_url: z.string().nullable().optional(),
  }),
  artwork_url: z.string().nullable(),
  stream_url: z.string().nullable().optional(),
})

const soundcloudSearchSchema = z.array(soundcloudTrackSchema)

// SoundCloud API Service Class
export class SoundCloudService {
  private clientId: string | null = null
  private clientSecret: string | null = null
  private accessToken: string | null = null
  private tokenExpiration = 0
  private static instance: SoundCloudService

  private constructor() {
    // Private constructor for singleton pattern
    this.clientId = process.env.NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID || null
    this.clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET || null
  }

  // Singleton pattern
  public static getInstance(): SoundCloudService {
    if (!SoundCloudService.instance) {
      SoundCloudService.instance = new SoundCloudService()
    }
    return SoundCloudService.instance
  }

  // Get an access token using client credentials flow
  private async getAccessToken(): Promise<string> {
    // Check if we already have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiration) {
      return this.accessToken
    }

    // For development/demo purposes, we'll use a mock token if credentials aren't set
    if (process.env.NODE_ENV === "development" && (!this.clientId || !this.clientSecret)) {
      console.warn(
        "Using mock SoundCloud token for development. Set NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID and SOUNDCLOUD_CLIENT_SECRET for real API access.",
      )
      this.accessToken = "mock-token-for-development"
      this.tokenExpiration = Date.now() + 3600 * 1000 // 1 hour
      return this.accessToken
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error("SoundCloud API credentials are not configured")
    }

    try {
      // Create Basic Auth header from client ID and secret
      const authHeader = `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`

      // Request token using client credentials flow
      const response = await fetch("https://secure.soundcloud.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: authHeader,
          Accept: "application/json; charset=utf-8",
        },
        body: "grant_type=client_credentials",
      })

      if (!response.ok) {
        throw new Error(`SoundCloud token request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const validatedData = soundcloudTokenSchema.parse(data)

      this.accessToken = validatedData.access_token
      this.tokenExpiration = Date.now() + validatedData.expires_in * 1000

      return this.accessToken
    } catch (error) {
      console.error("Error obtaining SoundCloud access token:", error)
      throw new Error("Failed to authenticate with SoundCloud API")
    }
  }

  // Search for a track on SoundCloud
  public async searchTrack(
    title: string,
    artist: string,
    preferences?: { style?: string; language?: string; source?: string },
  ): Promise<Track | null> {
    try {
      // Get an access token
      const token = await this.getAccessToken()

      // Construct search query
      const query = `${title} ${artist}`.trim()
      const encodedQuery = encodeURIComponent(query)

      // Perform the search
      const response = await fetch(`https://api.soundcloud.com/tracks?q=${encodedQuery}&limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json; charset=utf-8",
        },
      })

      if (!response.ok) {
        throw new Error(`SoundCloud search failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const validatedData = soundcloudSearchSchema.parse(data)

      // Check if any tracks were found
      if (validatedData.length === 0) {
        console.warn(`No tracks found for "${title}" by "${artist}"`)
        return null
      }

      // Get the first search result
      const trackData = validatedData[0]

      // Add logging to debug album cover issue
      console.log("Track data:", {
        id: trackData.id,
        title: trackData.title,
        artwork_url: trackData.artwork_url,
        user_avatar: trackData.user.avatar_url,
      })

      // Format the track data - Use user avatar if artwork is not available
      return {
        id: trackData.id.toString(),
        name: trackData.title,
        artist: trackData.user.username,
        albumCover:
          this.getHighResArtwork(trackData.artwork_url) || this.getHighResArtwork(trackData.user.avatar_url) || "",
        previewUrl: trackData.stream_url ? `${trackData.stream_url}?oauth_token=${token}` : null,
        soundcloudUrl: trackData.permalink_url,
        embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackData.permalink_url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
        source: "soundcloud",
      }
    } catch (error) {
      console.error(`Error searching for "${title}" by "${artist}":`, error)
      return null
    }
  }

  // Get high resolution artwork
  private getHighResArtwork(artworkUrl: string | null | undefined): string {
    if (!artworkUrl) {
      return ""
    }
    // Replace small size with large size
    return artworkUrl.replace("-large", "-t500x500")
  }

  // Clean up artist names by removing patterns like "Collective" and "& Friends"
  private cleanArtistName(artist: string): string {
    return artist
      .replace(/\s+Collective\b/g, "")
      .replace(/\s+& Friends\b/g, "")
      .replace(/\s+Band\b/g, "")
      .replace(/The\s+(.+)\s+Band/g, "$1")
      .replace(/\s+Collective$/g, "")
      .trim()
  }

  // Get recommendations from mood analysis
  public async getRecommendationsFromMoodAnalysis(moodAnalysis: MoodAnalysis): Promise<Track[]> {
    try {
      const tracks: Track[] = []

      // Extract user preferences
      const preferences = {
        style: moodAnalysis._style,
        language: moodAnalysis._language,
        source: moodAnalysis._source,
      }

      // Process each recommended track
      // Shuffle the recommended tracks to get different results each time
      const shuffledTracks = [...moodAnalysis.musicRecommendations.recommendedTracks].sort(() => Math.random() - 0.5)

      // Track any failed searches to handle them properly
      const failedSearches: { title: string; artist: string }[] = []

      // Standard processing without variations
      for (const trackInfo of shuffledTracks) {
        // Search on SoundCloud
        const track = await this.searchTrack(
          this.cleanArtistName(trackInfo.title),
          this.cleanArtistName(trackInfo.artist),
          preferences,
        )

        if (track) {
          tracks.push(track)
        } else {
          failedSearches.push({
            title: trackInfo.title,
            artist: trackInfo.artist,
          })
        }
      }

      // If we didn't get enough tracks, log the error
      if (tracks.length < shuffledTracks.length) {
        console.error(`Could not find ${failedSearches.length} tracks:`, failedSearches)
      }

      return tracks
    } catch (error) {
      console.error("Error getting recommendations:", error)
      // Just return an empty array if there's an error
      return []
    }
  }

  // Get mock tracks for a specific mood with added randomness
  private getMockTracksForMood(
    mood: string,
    preferences?: { style?: string; language?: string; source?: string },
  ): Track[] {
    // Updated mock tracks with more recent and famous songs
    const moodTracks: Record<string, Track[]> = {
      happy: [
        this.createMockTrack("As It Was", "Harry Styles"),
        this.createMockTrack("Blinding Lights", "The Weeknd"),
        this.createMockTrack("Flowers", "Miley Cyrus"),
        this.createMockTrack("Anti-Hero", "Taylor Swift"),
        this.createMockTrack("Uptown Funk", "Mark Ronson ft. Bruno Mars"),
        this.createMockTrack("Dynamite", "BTS"),
        this.createMockTrack("Good 4 U", "Olivia Rodrigo"),
        this.createMockTrack("Levitating", "Dua Lipa ft. DaBaby"),
        this.createMockTrack("Watermelon Sugar", "Harry Styles"),
        this.createMockTrack("Butter", "BTS"),
        this.createMockTrack("Don't Start Now", "Dua Lipa"),
        this.createMockTrack("STAY", "The Kid LAROI & Justin Bieber"),
      ],
      sad: [
        this.createMockTrack("drivers license", "Olivia Rodrigo"),
        this.createMockTrack("Easy On Me", "Adele"),
        this.createMockTrack("Glimpse of Us", "Joji"),
        this.createMockTrack("All Too Well (10 Minute Version)", "Taylor Swift"),
        this.createMockTrack("When the Party's Over", "Billie Eilish"),
        this.createMockTrack("Heather", "Conan Gray"),
        this.createMockTrack("traitor", "Olivia Rodrigo"),
        this.createMockTrack("Happier Than Ever", "Billie Eilish"),
        this.createMockTrack("Kill Bill", "SZA"),
        this.createMockTrack("Fix You", "Coldplay"),
        this.createMockTrack("Falling", "Harry Styles"),
        this.createMockTrack("Another Love", "Tom Odell"),
      ],
      energetic: [
        this.createMockTrack("Industry Baby", "Lil Nas X ft. Jack Harlow"),
        this.createMockTrack("abcdefu", "GAYLE"),
        this.createMockTrack("Physical", "Dua Lipa"),
        this.createMockTrack("Montero (Call Me By Your Name)", "Lil Nas X"),
        this.createMockTrack("Head & Heart", "Joel Corry ft. MNEK"),
        this.createMockTrack("Blinding Lights", "The Weeknd"),
        this.createMockTrack("Unholy", "Sam Smith & Kim Petras"),
        this.createMockTrack("AS IT WAS", "Harry Styles"),
        this.createMockTrack("Levitating", "Dua Lipa"),
        this.createMockTrack("STAY", "The Kid LAROI & Justin Bieber"),
        this.createMockTrack("Save Your Tears", "The Weeknd & Ariana Grande"),
        this.createMockTrack("Die For You", "The Weeknd & Ariana Grande"),
      ],
      relaxed: [
        this.createMockTrack("Calm Down", "Rema & Selena Gomez"),
        this.createMockTrack("Daylight", "Harry Styles"),
        this.createMockTrack("Lover", "Taylor Swift"),
        this.createMockTrack("cardigan", "Taylor Swift"),
        this.createMockTrack("Dandelions", "Ruth B"),
        this.createMockTrack("willow", "Taylor Swift"),
        this.createMockTrack("Heather", "Conan Gray"),
        this.createMockTrack("Lover", "Taylor Swift"),
        this.createMockTrack("Circles", "Post Malone"),
        this.createMockTrack("Sunflower", "Post Malone & Swae Lee"),
        this.createMockTrack("Shivers", "Ed Sheeran"),
        this.createMockTrack("Perfect", "Ed Sheeran"),
      ],
      excited: [
        this.createMockTrack("Dance The Night", "Dua Lipa"),
        this.createMockTrack("Levitating", "Dua Lipa"),
        this.createMockTrack("Uptown Funk", "Mark Ronson ft. Bruno Mars"),
        this.createMockTrack("Physical", "Dua Lipa"),
        this.createMockTrack("Dynamite", "BTS"),
        this.createMockTrack("Cruel Summer", "Taylor Swift"),
        this.createMockTrack("Butter", "BTS"),
        this.createMockTrack("Blinding Lights", "The Weeknd"),
        this.createMockTrack("Flowers", "Miley Cyrus"),
        this.createMockTrack("Heat Waves", "Glass Animals"),
        this.createMockTrack("STAY", "The Kid LAROI & Justin Bieber"),
        this.createMockTrack("Bad Habits", "Ed Sheeran"),
      ],
      calm: [
        this.createMockTrack("Calm Down", "Rema & Selena Gomez"),
        this.createMockTrack("Pink + White", "Frank Ocean"),
        this.createMockTrack("Daylight", "Taylor Swift"),
        this.createMockTrack("Bloom", "The Paper Kites"),
        this.createMockTrack("cardigan", "Taylor Swift"),
        this.createMockTrack("Snooze", "SZA"),
        this.createMockTrack("Dandelions", "Ruth B"),
        this.createMockTrack("Heather", "Conan Gray"),
        this.createMockTrack("Falling", "Harry Styles"),
        this.createMockTrack("midnight rain", "Taylor Swift"),
        this.createMockTrack("Snow On The Beach", "Taylor Swift ft. Lana Del Rey"),
        this.createMockTrack("Easy On Me", "Adele"),
      ],
      // Adding more mood categories with recent hits
      melancholic: [
        this.createMockTrack("Glimpse of Us", "Joji"),
        this.createMockTrack("idontwannabeyouanymore", "Billie Eilish"),
        this.createMockTrack("Flowers", "Miley Cyrus"),
        this.createMockTrack("Anti-Hero", "Taylor Swift"),
        this.createMockTrack("Easy On Me", "Adele"),
        this.createMockTrack("traitor", "Olivia Rodrigo"),
        this.createMockTrack("happier", "Olivia Rodrigo"),
        this.createMockTrack("Heather", "Conan Gray"),
        this.createMockTrack("Falling", "Harry Styles"),
        this.createMockTrack("All Too Well (10 Minute Version)", "Taylor Swift"),
        this.createMockTrack("good days", "SZA"),
        this.createMockTrack("Enchanted", "Taylor Swift"),
      ],
      confident: [
        this.createMockTrack("Flowers", "Miley Cyrus"),
        this.createMockTrack("IDOL", "BTS"),
        this.createMockTrack("As It Was", "Harry Styles"),
        this.createMockTrack("Levitating", "Dua Lipa"),
        this.createMockTrack("MONEY", "LISA"),
        this.createMockTrack("Run The World (Girls)", "Beyoncé"),
        this.createMockTrack("MONTERO (Call Me By Your Name)", "Lil Nas X"),
        this.createMockTrack("Woman", "Doja Cat"),
        this.createMockTrack("Confident", "Demi Lovato"),
        this.createMockTrack("I Am Not A Woman, I'm A God", "Halsey"),
        this.createMockTrack("You Need To Calm Down", "Taylor Swift"),
        this.createMockTrack("Unstoppable", "Sia"),
      ],
    }

    // Find the closest mood match
    const lowerMood = mood.toLowerCase()
    let matchedTracks: Track[] = []

    for (const [key, tracks] of Object.entries(moodTracks)) {
      if (lowerMood.includes(key) || key.includes(lowerMood)) {
        matchedTracks = tracks
        break
      }
    }

    // Default to happy tracks if no match
    if (matchedTracks.length === 0) {
      matchedTracks = moodTracks.happy
    }

    // Apply preferences if provided
    if (preferences) {
      matchedTracks = this.applyPreferences(matchedTracks, preferences)
    }

    // Shuffle the tracks and take a random subset
    return matchedTracks.sort(() => Math.random() - 0.5).slice(0, 9) // Return exactly 9 tracks
  }
}

// Function to get SoundCloud recommendations
export async function getSoundCloudRecommendations(moodAnalysis: MoodAnalysis): Promise<Track[]> {
  try {
    const soundcloudService = SoundCloudService.getInstance()
    return await soundcloudService.getRecommendationsFromMoodAnalysis(moodAnalysis)
  } catch (error) {
    console.error("Error in getSoundCloudRecommendations:", error)
    // Return empty array instead of default tracks
    return []
  }
}

