"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Filter, Loader2, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"

// Music style preferences for regeneration
interface MusicPreference {
  label: string
  value: string
  description: string
}

// Export these so they can be used elsewhere
export const musicStyles: MusicPreference[] = [
  { label: "Any Style", value: "any", description: "No specific style preference" },
  { label: "Pop", value: "pop", description: "Popular mainstream music" },
  { label: "Rock", value: "rock", description: "Guitar-driven rock music" },
  { label: "Hip-Hop", value: "hip-hop", description: "Rap and hip-hop music" },
  { label: "Electronic", value: "electronic", description: "Electronic and dance music" },
  { label: "R&B", value: "r&b", description: "Rhythm and blues" },
  { label: "Classical", value: "classical", description: "Classical compositions" },
  { label: "Jazz", value: "jazz", description: "Jazz music" },
  { label: "Indie", value: "indie", description: "Independent and alternative music" },
]

export const musicLanguages: MusicPreference[] = [
  { label: "Any Language", value: "any", description: "No specific language preference" },
  { label: "English", value: "english", description: "Songs in English" },
  { label: "Chinese", value: "chinese", description: "Songs in Chinese" },
  { label: "Japanese", value: "japanese", description: "Songs in Japanese" },
  { label: "Korean", value: "korean", description: "Songs in Korean" },
  { label: "Spanish", value: "spanish", description: "Songs in Spanish" },
]

export const musicSources: MusicPreference[] = [
  { label: "Any Source", value: "any", description: "No specific source preference" },
  { label: "Anime", value: "anime", description: "Songs from anime soundtracks" },
  { label: "Video Games", value: "games", description: "Songs from video game soundtracks" },
  { label: "Movies", value: "movies", description: "Songs from movie soundtracks" },
  { label: "TV Shows", value: "tv", description: "Songs from TV show soundtracks" },
]

// Helper function to get label from value
export function getLabelFromValue(value: string, preferences: MusicPreference[]): string {
  const preference = preferences.find((p) => p.value === value)
  return preference ? preference.label : value
}

interface MusicPreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    preferences: {
      style: string[]
      language: string[]
      source: string[]
    },
    generateRecommendations: boolean,
  ) => void
  isLoading?: boolean
  currentPreferences: {
    style: string[]
    language: string[]
    source: string[]
  }
}

export default function MusicPreferencesDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  currentPreferences,
}: MusicPreferencesDialogProps) {
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["any"])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["any"])
  const [selectedSources, setSelectedSources] = useState<string[]>(["any"])

  // Initialize with current preferences when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedStyles(currentPreferences.style.length > 0 ? [...currentPreferences.style] : ["any"])
      setSelectedLanguages(currentPreferences.language.length > 0 ? [...currentPreferences.language] : ["any"])
      setSelectedSources(currentPreferences.source.length > 0 ? [...currentPreferences.source] : ["any"])
    }
  }, [open, currentPreferences])

  const handleStyleToggle = (value: string) => {
    handleOptionToggle(value, selectedStyles, setSelectedStyles)
  }

  const handleLanguageToggle = (value: string) => {
    handleOptionToggle(value, selectedLanguages, setSelectedLanguages)
  }

  const handleSourceToggle = (value: string) => {
    handleOptionToggle(value, selectedSources, setSelectedSources)
  }

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

  const handleSaveOnly = () => {
    onSubmit(
      {
        style: selectedStyles,
        language: selectedLanguages,
        source: selectedSources,
      },
      false,
    )
  }

  const handleSaveAndGenerate = () => {
    onSubmit(
      {
        style: selectedStyles,
        language: selectedLanguages,
        source: selectedSources,
      },
      true,
    )
  }

  // Helper function to render a selection section
  const renderSelectionSection = (
    title: string,
    options: MusicPreference[],
    selectedValues: string[],
    onToggle: (value: string) => void,
  ) => (
    <div className="grid gap-2">
      <Label>{title}</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedValues.map((value) => (
          <Badge key={value} variant="secondary" className="px-2 py-1">
            {options.find((o) => o.value === value)?.label || value}
          </Badge>
        ))}
        {selectedValues.length === 0 && <span className="text-sm text-muted-foreground">No options selected</span>}
      </div>

      <ScrollArea className="h-[120px] md:h-[150px] rounded-md border p-4 bg-background">
        <div className="space-y-4">
          {options.map((option) => (
            <div key={option.value} className="flex items-start space-x-2">
              <Checkbox
                id={`${title.toLowerCase()}-${option.value}`}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={() => onToggle(option.value)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor={`${title.toLowerCase()}-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Customize Music Recommendations
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {renderSelectionSection("Music Styles", musicStyles, selectedStyles, handleStyleToggle)}
          {renderSelectionSection("Languages", musicLanguages, selectedLanguages, handleLanguageToggle)}
          {renderSelectionSection("Sources", musicSources, selectedSources, handleSourceToggle)}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleSaveOnly} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            Save Preferences
          </Button>
          <Button onClick={handleSaveAndGenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Save & Generate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

