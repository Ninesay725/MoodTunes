"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Music2, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navbar } from "@/components/navbar"
import { ApiService } from "@/lib/client/api-service"
import { useAuth } from "@/lib/context/auth-context"
import { getAllMoodEntries } from "@/lib/supabase/mood-entries"
import type { MoodAnalysis } from "@/server/types"

interface MoodEntry {
  id: string
  date: string
  description: string
  analysis: MoodAnalysis
  timestamp?: number
  created_at?: string
  user_id?: string
  mood_alignment?: "match" | "contrast"
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedEntries, setSelectedEntries] = useState<MoodEntry[]>([])
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchMoodEntries = async () => {
      setIsLoading(true)
      try {
        let entries: MoodEntry[] = []

        // If user is logged in, fetch from database
        if (user) {
          const dbEntries = await getAllMoodEntries(user.id)
          entries = dbEntries.map((entry) => ({
            id: entry.id,
            date: entry.date,
            description: entry.description,
            analysis: entry.analysis,
            timestamp: new Date(entry.created_at).getTime(),
            created_at: entry.created_at,
            user_id: entry.user_id,
            mood_alignment: entry.mood_alignment,
          }))
        } else {
          // Otherwise, get from local storage
          entries = ApiService.getAllMoodEntries()
        }

        setMoodHistory(entries)
      } catch (error) {
        console.error("Error loading mood history:", error)
        setError("Failed to load your mood history")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMoodEntries()
  }, [user])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Get all mood entries for a specific day
  const getMoodEntriesForDay = (day: Date): MoodEntry[] => {
    // Format the day to YYYY-MM-DD for comparison
    const formattedDay = format(day, "yyyy-MM-dd")

    // Find all entries for this day
    return moodHistory
      .filter((entry) => {
        // Use the date field directly for comparison
        return entry.date === formattedDay
      })
      .sort((a, b) => {
        // Sort by timestamp (newest first)
        const timestampA = a.timestamp || (a.created_at ? new Date(a.created_at).getTime() : 0)
        const timestampB = b.timestamp || (b.created_at ? new Date(b.created_at).getTime() : 0)
        return timestampB - timestampA
      })
  }

  // Get the latest mood entry for a day
  const getLatestMoodForDay = (day: Date): MoodEntry | null => {
    const entries = getMoodEntriesForDay(day)
    return entries.length > 0 ? entries[0] : null
  }

  // Handle day selection
  const handleDayClick = (day: Date) => {
    const entries = getMoodEntriesForDay(day)
    if (entries.length === 0) return

    setSelectedDay(day)
    setSelectedEntries(entries)
    setActiveEntryId(entries[0].id)
  }

  const getEmotionColor = (emotion: string | undefined | null) => {
    if (!emotion) {
      return "bg-gray-500" // Default color for undefined or null emotions
    }

    const emotionColors: Record<string, string> = {
      happy: "bg-green-500",
      sad: "bg-blue-500",
      angry: "bg-red-500",
      anxious: "bg-yellow-500",
      excited: "bg-purple-500",
      relaxed: "bg-teal-500",
      stressed: "bg-orange-500",
      content: "bg-emerald-500",
      nostalgic: "bg-indigo-500",
      hopeful: "bg-cyan-500",
      unknown: "bg-gray-500",
    }

    const lowerEmotion = emotion.toLowerCase()
    return emotionColors[lowerEmotion] || "bg-gray-500"
  }

  // Get the active entry
  const getActiveEntry = (): MoodEntry | null => {
    if (!activeEntryId || selectedEntries.length === 0) return null
    return selectedEntries.find((entry) => entry.id === activeEntryId) || selectedEntries[0]
  }

  const activeEntry = getActiveEntry()

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container py-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold">Mood Calendar</h1>
            <Link href="/mood">
              <Button>
                <Music2 className="mr-2 h-4 w-4" />
                New Mood
              </Button>
            </Link>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Your Mood History</CardTitle>
                <CardDescription>Track your emotional journey and music recommendations</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">{format(currentDate, "MMMM yyyy")}</span>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-sm font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                  <div key={`empty-start-${index}`} className="h-24 p-1" />
                ))}

                {monthDays.map((day) => {
                  const moodEntry = getLatestMoodForDay(day)
                  const allEntries = getMoodEntriesForDay(day)
                  const entryCount = allEntries.length
                  const isSelected = selectedDay && isSameDay(day, selectedDay)

                  return (
                    <div
                      key={day.toString()}
                      className={`h-24 p-1 border rounded-md relative ${
                        isToday(day) ? "border-primary" : "border-gray-200"
                      } ${isSelected ? "ring-2 ring-primary" : ""} ${entryCount > 0 ? "cursor-pointer hover:bg-gray-50" : ""}`}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
                      {moodEntry && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-4 h-4 rounded-full ${getEmotionColor(moodEntry.analysis.primaryMood)}`}
                              title={moodEntry.analysis.primaryMood}
                            />
                            {entryCount > 1 && <span className="text-xs text-muted-foreground">+{entryCount - 1}</span>}
                          </div>
                          <div className="text-xs truncate">{moodEntry.analysis.primaryMood}</div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
                  <div key={`empty-end-${index}`} className="h-24 p-1" />
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mood Details - {selectedDay ? format(selectedDay, "MMMM d, yyyy") : ""}</CardTitle>
                <CardDescription>
                  {selectedEntries.length > 1
                    ? `You recorded ${selectedEntries.length} moods on this day`
                    : "Your mood record for this day"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedEntries.length > 1 ? (
                  <Tabs defaultValue={activeEntryId || selectedEntries[0].id} onValueChange={setActiveEntryId}>
                    <TabsList className="mb-4">
                      {selectedEntries.map((entry, index) => {
                        const entryTime = entry.timestamp
                          ? new Date(entry.timestamp)
                          : entry.created_at
                            ? new Date(entry.created_at)
                            : new Date()
                        return (
                          <TabsTrigger key={entry.id} value={entry.id}>
                            Entry {index + 1} ({format(entryTime, "h:mm a")})
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>

                    {selectedEntries.map((entry) => (
                      <TabsContent key={entry.id} value={entry.id}>
                        <MoodEntryDetails entry={entry} />
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : activeEntry ? (
                  <MoodEntryDetails entry={activeEntry} />
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

// Separate component for mood entry details
function MoodEntryDetails({ entry }: { entry: MoodEntry }) {
  const entryTime = entry.timestamp
    ? new Date(entry.timestamp)
    : entry.created_at
      ? new Date(entry.created_at)
      : new Date()

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <h3 className="font-medium mb-2">Your Description</h3>
        <p className="text-gray-500">{entry.description}</p>
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Recorded at {format(entryTime, "h:mm a")}</span>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Mood Analysis</h3>
          <p className="text-gray-500 text-sm">{entry.analysis.moodAnalysis}</p>
        </div>
        <div>
          <h3 className="font-medium mb-2">Emotions</h3>
          <div className="flex gap-2">
            <Badge className="bg-primary">{entry.analysis.primaryMood}</Badge>
            {entry.analysis.secondaryMood && <Badge className="bg-secondary">{entry.analysis.secondaryMood}</Badge>}
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">Music Recommendation</h3>
          <div className="flex flex-wrap gap-2">
            {entry.analysis.musicRecommendations.genres.map((genre) => (
              <Badge key={genre} variant="outline">
                {genre}
              </Badge>
            ))}
            <Badge variant="outline">{entry.analysis.musicRecommendations.tempo}</Badge>
            <Badge variant="outline">{entry.analysis.musicRecommendations.playlistMood}</Badge>
          </div>
        </div>
        {entry.mood_alignment && (
          <div>
            <h3 className="font-medium mb-2">Recommendation Style</h3>
            <Badge variant="outline" className="capitalize">
              {entry.mood_alignment === "match" ? "Matching your mood" : "Contrasting your mood"}
            </Badge>
          </div>
        )}
        <div className="pt-4">
          <Link href={`/recommendations/${entry.id}`}>
            <Button>
              <Music2 className="mr-2 h-4 w-4" />
              View Music Recommendations
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

