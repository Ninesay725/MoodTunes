"use client"

import type React from "react"
import { useState } from "react"
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

export default function MoodPage() {
  const [moodDescription, setMoodDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!moodDescription.trim()) return

    setIsAnalyzing(true)
    setError(null)

    try {
      // Analyze mood using the API service
      const moodAnalysis = await ApiService.analyzeMood(moodDescription)

      // Check if there was an error in the analysis
      if (moodAnalysis.error) {
        throw new Error(moodAnalysis.error)
      }

      // Validate the mood analysis result
      if (!moodAnalysis.musicRecommendations || !Array.isArray(moodAnalysis.musicRecommendations.recommendedTracks)) {
        throw new Error("Invalid mood analysis result. Missing music recommendations.")
      }

      // Get current date in local timezone as YYYY-MM-DD
      const today = format(new Date(), "yyyy-MM-dd")

      // Create and save the new entry
      const entryId = ApiService.saveMoodEntry({
        date: today,
        description: moodDescription,
        analysis: moodAnalysis,
      })

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

