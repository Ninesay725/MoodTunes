"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Check, Save } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/lib/context/auth-context"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { getUserPreferences, updateUserPreferences } from "@/lib/supabase/user-preferences"
import type { UserPreferences } from "@/lib/supabase/user-preferences"
import { musicStyles, musicLanguages, musicSources } from "@/components/music-preferences-dialog"
import { Checkbox } from "@/components/ui/checkbox"

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["any"])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["any"])
  const [selectedSources, setSelectedSources] = useState<string[]>(["any"])
  const [moodAlignment, setMoodAlignment] = useState<"match" | "contrast">("match")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  // Fetch user preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const prefsData = await getUserPreferences(user.id)
        if (prefsData) {
          setPreferences(prefsData)
          setSelectedStyles(prefsData.music_style)
          setSelectedLanguages(prefsData.music_language)
          setSelectedSources(prefsData.music_source)
          setMoodAlignment(prefsData.default_mood_alignment)
        }
      } catch (err) {
        console.error("Error fetching preferences:", err)
        setError("Failed to load preferences")
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading && user) {
      fetchPreferences()
    } else if (!authLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, authLoading, router])

  // Generic handler for toggling options in any multi-select
  const handleOptionToggle = (
    value: string,
    selectedValues: string[],
    setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    if (value === "any") {
      setSelectedValues(["any"])
      return
    }

    setSelectedValues((prev) => {
      // If "any" is currently selected, remove it
      const filtered = prev.filter((item) => item !== "any")

      // If this value is already selected, remove it
      if (filtered.includes(value)) {
        const result = filtered.filter((item) => item !== value)
        // If removing this makes the selection empty, select "any"
        return result.length === 0 ? ["any"] : result
      }

      // Otherwise add it
      return [...filtered, value]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      const updates = {
        music_style: selectedStyles,
        music_language: selectedLanguages,
        music_source: selectedSources,
        default_mood_alignment: moodAlignment,
      }

      const updatedPrefs = await updateUserPreferences(user.id, updates)

      if (!updatedPrefs) {
        throw new Error("Failed to update preferences")
      }

      setPreferences(updatedPrefs)
      setSuccess("Preferences updated successfully")
    } catch (err) {
      console.error("Error updating preferences:", err)
      setError("Failed to update preferences")
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <>
        <Navbar />
        <div className="container flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (!user) {
    return null // Router will redirect to sign in
  }

  return (
    <>
      <Navbar />
      <div className="container max-w-4xl py-12">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Success</AlertTitle>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Music Preferences</CardTitle>
              <CardDescription>Set your default music preferences for mood analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Mood Alignment */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Default Recommendation Style</Label>
                <RadioGroup
                  value={moodAlignment}
                  onValueChange={(value) => setMoodAlignment(value as "match" | "contrast")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2 rounded-md border p-3 shadow-sm">
                    <RadioGroupItem value="match" id="match" />
                    <Label htmlFor="match" className="flex flex-col">
                      <span className="font-medium">Match my mood</span>
                      <span className="text-sm text-muted-foreground">
                        Recommend music that aligns with how I'm feeling
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

              {/* Music Styles */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Preferred Music Styles</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {musicStyles.map((style) => (
                    <div key={style.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`style-${style.value}`}
                        checked={selectedStyles.includes(style.value)}
                        onCheckedChange={() => handleOptionToggle(style.value, selectedStyles, setSelectedStyles)}
                      />
                      <Label htmlFor={`style-${style.value}`}>{style.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Music Languages */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Preferred Languages</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {musicLanguages.map((language) => (
                    <div key={language.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`language-${language.value}`}
                        checked={selectedLanguages.includes(language.value)}
                        onCheckedChange={() =>
                          handleOptionToggle(language.value, selectedLanguages, setSelectedLanguages)
                        }
                      />
                      <Label htmlFor={`language-${language.value}`}>{language.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Music Sources */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Preferred Music Sources</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {musicSources.map((source) => (
                    <div key={source.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`source-${source.value}`}
                        checked={selectedSources.includes(source.value)}
                        onCheckedChange={() => handleOptionToggle(source.value, selectedSources, setSelectedSources)}
                      />
                      <Label htmlFor={`source-${source.value}`}>{source.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  )
}

