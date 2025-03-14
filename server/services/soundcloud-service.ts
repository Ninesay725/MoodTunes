import { z } from "zod"
import type { MoodAnalysis, Track } from "../types"

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

  // Create a placeholder track when a track is not found on SoundCloud
  private createPlaceholderTrack(title: string, artist: string): Track {
    // Generate a unique ID for the placeholder track
    const id = `placeholder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    return {
      id,
      name: title,
      artist: artist,
      albumCover: "", // No album cover for placeholder tracks
      previewUrl: null,
      soundcloudUrl: "", // No SoundCloud URL
      embedUrl: "", // No embed URL
      source: "none", // Mark as not from SoundCloud
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
        // Return a placeholder track instead of null
        return this.createPlaceholderTrack(title, artist)
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
      // Return a placeholder track instead of null
      return this.createPlaceholderTrack(title, artist)
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

  // Add a method to check for duplicate tracks
  private isDuplicateTrack(track: Track, existingTracks: Track[]): boolean {
    // Normalize the track name and artist
    const normalizeTrackInfo = (title: string, artist: string): string => {
      if (!title || !artist) return ""

      // Convert to lowercase, trim whitespace, and normalize spaces
      const normalizedTitle = title.toLowerCase().trim().replace(/\s+/g, " ")
      const normalizedArtist = artist.toLowerCase().trim().replace(/\s+/g, " ")

      // Remove common features indicators
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

    const normalizedTrack = normalizeTrackInfo(track.name, track.artist)
    if (!normalizedTrack) return false

    return existingTracks.some((existingTrack) => {
      const existingNormalized = normalizeTrackInfo(existingTrack.name, existingTrack.artist)
      return normalizedTrack === existingNormalized
    })
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
        // Clean artist names
        const cleanTitle = this.cleanArtistName(trackInfo.title)
        const cleanArtist = this.cleanArtistName(trackInfo.artist)

        // Log for debugging
        console.log(`Searching for track: "${cleanTitle}" by "${cleanArtist}"`)

        // Search on SoundCloud
        const track = await this.searchTrack(cleanTitle, cleanArtist, preferences)

        if (track) {
          // Check if this track is a duplicate of one we already found
          if (!this.isDuplicateTrack(track, tracks)) {
            tracks.push(track)
            console.log(`Added track: "${track.name}" by "${track.artist}"`)
          } else {
            console.log(`Skipped duplicate track: "${track.name}" by "${track.artist}"`)
            // If it's a duplicate but not found on SoundCloud, still log it
            if (track.source === "none") {
              failedSearches.push({
                title: trackInfo.title,
                artist: trackInfo.artist,
              })
            }
          }
        }
      }

      // If we didn't get enough tracks, log the error
      if (failedSearches.length > 0) {
        console.error(`Could not find ${failedSearches.length} tracks:`, failedSearches)
      }

      return tracks
    } catch (error) {
      console.error("Error getting recommendations:", error)
      // Just return an empty array if there's an error
      return []
    }
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

