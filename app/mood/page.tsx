"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { Navbar } from "@/components/navbar"
import { ApiService } from "@/lib/client/api-service"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/context/auth-context"
import { saveMoodEntry } from "@/lib/supabase/mood-entries"
import { getUserPreferences } from "@/lib/supabase/user-preferences"
import type { UserPreferences } from "@/lib/supabase/user-preferences"

export default function MoodPage() {
  const [moodDescription, setMoodDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [moodAlignment, setMoodAlignment] = useState<"match" | "contrast">("match")
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  // Fetch user preferences when the component mounts
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) return

      setIsLoadingPreferences(true)
      try {
        const preferences = await getUserPreferences(user.id)
        if (preferences) {
          setUserPreferences(preferences)
          // Apply the default mood alignment from preferences
          setMoodAlignment(preferences.default_mood_alignment)
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error)
      } finally {
        setIsLoadingPreferences(false)
      }
    }

    fetchUserPreferences()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!moodDescription.trim()) return

    setIsAnalyzing(true)
    setError(null)

    try {
      // Prepare preferences from user's saved preferences
      const preferences = userPreferences
        ? {
            style: userPreferences.music_style,
            language: userPreferences.music_language,
            source: userPreferences.music_source,
          }
        : undefined

      // Analyze mood using the API service, passing the mood alignment preference and user preferences
      const moodAnalysis = await ApiService.analyzeMood(moodDescription, preferences, undefined, moodAlignment)

      // Check if there was an error in the analysis
      if (moodAnalysis.error) {
        throw new Error(moodAnalysis.error)
      }

      // Validate the mood analysis result
      if (!moodAnalysis.musicRecommendations || !Array.isArray(moodAnalysis.musicRecommendations.recommendedTracks)) {
        throw new Error("Invalid mood analysis result. Missing music recommendations.")
      }

      // Get current date in local timezone as YYYY-MM-DD
      // Use the user's local timezone to get the correct date
      const now = new Date()
      const today = format(now, "yyyy-MM-dd")

      let entryId: string

      // If user is logged in, save to database
      if (user) {
        const result = await saveMoodEntry(user.id, {
          date: today,
          description: moodDescription,
          analysis: moodAnalysis,
          mood_alignment: moodAlignment,
        })

        if (!result) {
          throw new Error("Failed to save mood entry to database")
        }

        entryId = result.id
      } else {
        // Otherwise, save to local storage
        entryId = ApiService.saveMoodEntry({
          date: today,
          description: moodDescription,
          analysis: moodAnalysis,
          moodAlignment: moodAlignment,
        })
      }

      // Navigate to results page
      router.push(`/recommendations/${entryId}`)
    } catch (error) {
      console.error("Error analyzing mood:", error)
      setError(error instanceof Error ? error.message : "Failed to analyze your mood. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container max-w-4xl py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">How are you feeling today?</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Describe your mood</CardTitle>
            <CardDescription>
              Tell us how you're feeling in your own words. Our Gemini 2.0 Flash AI will analyze your mood and suggest
              music.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <Textarea
                placeholder="I'm feeling a bit overwhelmed with work today, but also excited about my upcoming vacation..."
                className="min-h-[200px] resize-none"
                value={moodDescription}
                onChange={(e) => setMoodDescription(e.target.value)}
                disabled={isAnalyzing}
              />
              <div className="mt-6 space-y-2">
                <Label htmlFor="mood-alignment" className="text-base font-medium">
                  Music Recommendation Style
                </Label>
                <RadioGroup
                  id="mood-alignment"
                  value={moodAlignment}
                  onValueChange={(value) => setMoodAlignment(value as "match" | "contrast")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2 rounded-md border p-3 shadow-sm">
                    <RadioGroupItem value="match" id="match" />
                    <Label htmlFor="match" className="flex flex-col">
                      <span className="font-medium">Match my mood</span>
                      <span className="text-sm text-muted-foreground">
                        Recommend music that aligns with how I'm feeling right now
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 shadow-sm">
                    <RadioGroupItem value="contrast" id="contrast" />
                    <Label htmlFor="contrast" className="flex flex-col">
                      <span className="font-medium">Contrast my mood</span>
                      <span className="text-sm text-muted-foreground">
                        If I'm feeling down, recommend uplifting music. If I'm energetic, recommend calming music.
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {userPreferences && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Using your saved preferences:</p>
                  <ul className="text-xs text-muted-foreground mt-1">
                    {!userPreferences.music_style.includes("any") && (
                      <li>• Music styles: {userPreferences.music_style.join(", ")}</li>
                    )}
                    {!userPreferences.music_language.includes("any") && (
                      <li>• Languages: {userPreferences.music_language.join(", ")}</li>
                    )}
                    {!userPreferences.music_source.includes("any") && (
                      <li>• Sources: {userPreferences.music_source.join(", ")}</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {moodDescription.length > 0 ? `${moodDescription.length} characters` : ""}
              </div>
              <Button type="submit" disabled={isAnalyzing || !moodDescription.trim()}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Get Music Recommendations"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  )
}

