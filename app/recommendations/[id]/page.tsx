"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Music2, Calendar, ExternalLink, Info, RefreshCw, Filter, Search, AlertTriangle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Navbar } from "@/components/navbar"
import MusicPreferencesDialog, {
  musicStyles,
  musicLanguages,
  musicSources,
  getLabelFromValue,
} from "@/components/music-preferences-dialog"
import SoundCloudPlayer from "@/components/soundcloud-player"
import { ApiService } from "@/lib/client/api-service"
import type { MoodAnalysis, Track, MusicPreferences } from "@/server/types"

interface MoodEntry {
  id: string
  date: string
  description: string
  analysis: MoodAnalysis
  timestamp: number
}

export default function RecommendationsPage({ params }: { params: { id: string } }) {
  // Access the id directly from params
  const { id } = params

  const [moodEntry, setMoodEntry] = useState<MoodEntry | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Add state for tracking all recommended tracks and user preferences
  const [allRecommendedTracks, setAllRecommendedTracks] = useState<Array<{ title: string; artist: string }>>([])
  const [userPreferences, setUserPreferences] = useState<MusicPreferences>({
    style: ["any"],
    language: ["any"],
    source: ["any"],
  })

  // Function to normalize track title and artist for comparison
  const normalizeTrackInfo = (title: string, artist: string): string => {
    return `${title.toLowerCase().trim()} - ${artist.toLowerCase().trim()}`.replace(/\s+/g, " ")
  }

  // Function to check if a track has already been recommended
  const isTrackAlreadyRecommended = (title: string, artist: string): boolean => {
    const normalizedTrack = normalizeTrackInfo(title, artist)
    return allRecommendedTracks.some((track) => normalizeTrackInfo(track.title, track.artist) === normalizedTrack)
  }

  // Format preferences for display with proper labels
  const formatPreferencesForDisplay = (preferences: MusicPreferences): string => {
    const parts = []

    if (!preferences.style.includes("any")) {
      const styleLabels = preferences.style.map((value) => getLabelFromValue(value, musicStyles))
      parts.push(`Styles: ${styleLabels.join(", ")}`)
    }

    if (!preferences.language.includes("any")) {
      const languageLabels = preferences.language.map((value) => getLabelFromValue(value, musicLanguages))
      parts.push(`Languages: ${languageLabels.join(", ")}`)
    }

    if (!preferences.source.includes("any")) {
      const sourceLabels = preferences.source.map((value) => getLabelFromValue(value, musicSources))
      parts.push(`Sources: ${sourceLabels.join(", ")}`)
    }

    return parts.length > 0 ? parts.join(" • ") : "No specific preferences"
  }

  // Update the useEffect to initialize allRecommendedTracks
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the mood entry by ID
        const entry = ApiService.getMoodEntryById(id)

        if (!entry) {
          setError("Mood entry not found")
          setLoading(false)
          return
        }

        setMoodEntry(entry)

        // Check if there was an error in the analysis
        if (entry.analysis.error) {
          setError(`Analysis error: ${entry.analysis.error}`)
          setLoading(false)
          return
        }

        // Validate the mood analysis result
        if (
          !entry.analysis.musicRecommendations ||
          !Array.isArray(entry.analysis.musicRecommendations.recommendedTracks)
        ) {
          setError("Invalid mood analysis result. Missing music recommendations.")
          setLoading(false)
          return
        }

        // Initialize user preferences from the mood analysis if available
        if (entry.analysis._style || entry.analysis._language || entry.analysis._source) {
          const initialPreferences = {
            style: Array.isArray(entry.analysis._style)
              ? entry.analysis._style
              : entry.analysis._style
                ? [entry.analysis._style as string]
                : ["any"],
            language: Array.isArray(entry.analysis._language)
              ? entry.analysis._language
              : entry.analysis._language
                ? [entry.analysis._language as string]
                : ["any"],
            source: Array.isArray(entry.analysis._source)
              ? entry.analysis._source
              : entry.analysis._source
                ? [entry.analysis._source as string]
                : ["any"],
          }
          setUserPreferences(initialPreferences)
        }

        // Fetch music recommendations from the server
        const recommendations = await ApiService.getRecommendations(entry.analysis)

        if (recommendations.length === 0) {
          setError("No music recommendations found. Please try again.")
          setLoading(false)
          return
        }

        // Track the recommended tracks
        const tracksToTrack = recommendations.map((track: Track) => ({
          title: track.name,
          artist: track.artist,
        }))

        // Make sure we have unique tracks
        const uniqueTracksToTrack = tracksToTrack.filter(
          (track, index, self) =>
            self.findIndex(
              (t) => normalizeTrackInfo(t.title, t.artist) === normalizeTrackInfo(track.title, track.artist),
            ) === index,
        )

        setAllRecommendedTracks(uniqueTracksToTrack)
        setTracks(recommendations)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "Failed to load recommendations")
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Update the handleQuickRefresh function to use allRecommendedTracks and userPreferences
  const handleQuickRefresh = async () => {
    if (!moodEntry || refreshing) return

    setRefreshing(true)
    setError(null)

    try {
      // Get the entry from local storage
      const entry = ApiService.getMoodEntryById(id)

      if (entry) {
        // Log the current recommended tracks for debugging
        console.log("Already recommended tracks:", allRecommendedTracks)
        console.log("Using preferences:", userPreferences)

        // Re-analyze the mood with the same description but avoid previously recommended tracks
        const newAnalysis = await ApiService.analyzeMood(entry.description, userPreferences, allRecommendedTracks)

        // Validate the new analysis
        if (!newAnalysis.musicRecommendations || !Array.isArray(newAnalysis.musicRecommendations.recommendedTracks)) {
          throw new Error("Invalid mood analysis result. Missing music recommendations.")
        }

        // Get recommendations based on the new analysis
        const newTracks = await ApiService.getRecommendations(newAnalysis)

        if (newTracks.length === 0) {
          throw new Error("No new music recommendations found. Please try different preferences.")
        }

        // Track the new recommendations
        const newTracksToTrack = newTracks.map((track) => ({
          title: track.name,
          artist: track.artist,
        }))

        // Check for duplicates before adding
        const uniqueNewTracks = newTracksToTrack.filter(
          (track) => !isTrackAlreadyRecommended(track.title, track.artist),
        )

        if (uniqueNewTracks.length === 0) {
          throw new Error("All available tracks have been recommended. Please try different preferences.")
        }

        // Update the list of all recommended tracks
        setAllRecommendedTracks((prev) => [...prev, ...uniqueNewTracks])

        // Update the displayed tracks
        setTracks(newTracks)
      }
    } catch (err) {
      console.error("Error refreshing recommendations:", err)
      setError(err instanceof Error ? err.message : "Failed to refresh recommendations")
    } finally {
      setRefreshing(false)
    }
  }

  // Update the handlePreferencesChange function to handle both save-only and save-and-generate
  const handlePreferencesChange = async (preferences: MusicPreferences, generateRecommendations: boolean) => {
    // Save the user preferences
    setUserPreferences(preferences)

    // Close the dialog
    setDialogOpen(false)

    // If we're not generating recommendations, just return
    if (!generateRecommendations) {
      return
    }

    // Otherwise, proceed with generating recommendations
    if (!moodEntry || refreshing) return

    setRefreshing(true)
    setError(null)

    try {
      // Get the entry from local storage
      const entry = ApiService.getMoodEntryById(id)

      if (entry) {
        console.log("Using preferences:", preferences)
        console.log("Already recommended tracks:", allRecommendedTracks)

        // Re-analyze the mood with the same description and avoid previously recommended tracks
        const newAnalysis = await ApiService.analyzeMood(entry.description, preferences, allRecommendedTracks)

        // Validate the new analysis
        if (!newAnalysis.musicRecommendations || !Array.isArray(newAnalysis.musicRecommendations.recommendedTracks)) {
          throw new Error("Invalid mood analysis result. Missing music recommendations.")
        }

        // Get recommendations based on the new analysis
        const newTracks = await ApiService.getRecommendations(newAnalysis)

        if (newTracks.length === 0) {
          throw new Error("No new music recommendations found. Please try different preferences.")
        }

        // Track the new recommendations
        const newTracksToTrack = newTracks.map((track) => ({
          title: track.name,
          artist: track.artist,
        }))

        // Check for duplicates before adding
        const uniqueNewTracks = newTracksToTrack.filter(
          (track) => !isTrackAlreadyRecommended(track.title, track.artist),
        )

        if (uniqueNewTracks.length === 0) {
          throw new Error("All available tracks have been recommended. Please try different preferences.")
        }

        // Update the list of all recommended tracks
        setAllRecommendedTracks((prev) => [...prev, ...uniqueNewTracks])

        // Update the displayed tracks
        setTracks(newTracks)
      }
    } catch (err) {
      console.error("Error refreshing recommendations:", err)
      setError(err instanceof Error ? err.message : "Failed to refresh recommendations")
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container py-12">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-8">
            <Link href="/mood">
              <Button>Create a new mood entry</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  if (!moodEntry) {
    return (
      <>
        <Navbar />
        <div className="container py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Mood entry not found</h2>
              <p className="text-gray-500 mb-6">We couldn't find the mood entry you're looking for.</p>
              <Link href="/mood">
                <Button>Create a new mood entry</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  // Check if we have active preferences (not "any")
  const hasActivePreferences =
    !userPreferences.style.includes("any") ||
    !userPreferences.language.includes("any") ||
    !userPreferences.source.includes("any")

  return (
    <>
      <Navbar />
      <div className="container py-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold">Your Music Recommendations</h1>
            <div className="flex gap-2">
              {/* Quick refresh button */}
              <Button variant="outline" size="sm" disabled={refreshing} onClick={handleQuickRefresh}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Quick Refresh"}
              </Button>

              {/* Advanced refresh with preferences */}
              <Button variant="outline" size="sm" disabled={refreshing} onClick={() => setDialogOpen(true)}>
                <Filter className="mr-2 h-4 w-4" />
                Customize
              </Button>

              <Link href="/calendar">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Mood Calendar
                </Button>
              </Link>
            </div>
          </div>

          {/* Display active preferences if any - with improved styling */}
          {hasActivePreferences && (
            <Alert className="bg-primary/10 border-primary/20">
              <Filter className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-medium">Active Preferences</AlertTitle>
              <AlertDescription className="mt-1 text-sm font-medium">
                {formatPreferencesForDisplay(userPreferences)}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Your Mood Analysis</CardTitle>
              <CardDescription>Based on your description, we've analyzed your emotional state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Your Description</h3>
                  <p className="text-gray-500 text-sm">{moodEntry.description}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Mood Analysis</h3>
                    <p className="text-gray-500 text-sm">{moodEntry.analysis.moodAnalysis}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Primary Mood</h3>
                    <Badge className="bg-primary">{moodEntry.analysis.primaryMood}</Badge>
                    {moodEntry.analysis.secondaryMood && (
                      <Badge className="ml-2 bg-secondary">{moodEntry.analysis.secondaryMood}</Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Music Recommendation</h3>
                    <div className="flex flex-wrap gap-2">
                      {moodEntry.analysis.musicRecommendations.genres.map((genre) => (
                        <Badge key={genre} variant="outline">
                          {genre}
                        </Badge>
                      ))}
                      <Badge variant="outline">{moodEntry.analysis.musicRecommendations.tempo}</Badge>
                      <Badge variant="outline">{moodEntry.analysis.musicRecommendations.playlistMood}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mt-4">Recommended Tracks</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => (
              <Card key={track.id} className="overflow-hidden flex flex-col">
                <div className="aspect-square relative bg-muted">
                  {track.albumCover ? (
                    <img
                      src={track.albumCover || "/placeholder.svg"}
                      alt={`${track.name} album cover`}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement
                        console.error(`Failed to load album cover for ${track.name}`, e)
                        target.src = `/placeholder.svg?height=300&width=300&text=${encodeURIComponent(`${track.name} - ${track.artist}`)}`
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/20 p-4">
                      <Music2 className="h-16 w-16 text-primary/60 mb-2" />
                      <div className="text-center">
                        <p className="font-medium text-sm">{track.name}</p>
                        <p className="text-xs text-muted-foreground">{track.artist}</p>
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="pt-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <h3 className="font-bold truncate">{track.name}</h3>
                      <p className="text-gray-500 text-sm truncate">{track.artist}</p>

                      {/* Show a "Not found on SoundCloud" badge for placeholder tracks */}
                      {track.source === "none" && (
                        <div className="flex items-center mt-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>Not found on SoundCloud</span>
                        </div>
                      )}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 mt-[-4px]">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">This track matches your {moodEntry.analysis.primaryMood} mood</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* SoundCloud Player - only show for tracks found on SoundCloud */}
                  {track.source === "soundcloud" && track.embedUrl && (
                    <div className="mt-2">
                      <SoundCloudPlayer embedUrl={track.embedUrl} title={track.name} />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {/* Only show SoundCloud button for tracks found on SoundCloud */}
                  {track.source === "soundcloud" && track.soundcloudUrl && (
                    <a href={track.soundcloudUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open in SoundCloud
                      </Button>
                    </a>
                  )}

                  {/* "Search on Google" button - show for all tracks, but make it primary for tracks not on SoundCloud */}
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${track.name} ${track.artist} song`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button
                      variant={track.source === "none" ? "default" : "ghost"}
                      size={track.source === "none" ? "default" : "sm"}
                      className="w-full text-xs"
                    >
                      <Search className="mr-1 h-3 w-3" />
                      {track.source === "none" ? "Search on Google" : "Not correct track? Let's search on Google"}
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Display if no tracks were found */}
          {tracks.length === 0 && !loading && !error && (
            <Card className="p-6 text-center">
              <h3 className="text-xl font-bold mb-2">No tracks found</h3>
              <p className="text-gray-500 mb-4">
                We couldn't find any matching tracks. Try refreshing or changing your preferences.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Filter className="mr-2 h-4 w-4" />
                Customize Preferences
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Music Preferences Dialog using shadcn/ui components */}
      <MusicPreferencesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handlePreferencesChange}
        isLoading={refreshing}
        currentPreferences={userPreferences}
      />
    </>
  )
}

