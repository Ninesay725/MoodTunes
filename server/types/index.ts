// Shared types between client and server
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
  source: "soundcloud" | "none" // Added "none" as a possible source
}

export interface MusicPreferences {
  style: string[]
  language: string[]
  source: string[]
}

export interface MoodEntry {
  id: string
  date: string
  description: string
  analysis: MoodAnalysis
  timestamp: number
}

