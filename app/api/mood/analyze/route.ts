import { type NextRequest, NextResponse } from "next/server"
import { analyzeMood } from "@/server/actions/mood-actions"

export async function POST(request: NextRequest) {
  try {
    const { moodDescription, preferences, previouslyRecommendedTracks, moodAlignment } = await request.json()

    if (!moodDescription) {
      return NextResponse.json({ error: "Mood description is required" }, { status: 400 })
    }

    // Log the preferences for debugging
    console.log("Received preferences:", preferences)
    console.log("Mood alignment:", moodAlignment)

    const moodAnalysis = await analyzeMood(moodDescription, preferences, previouslyRecommendedTracks, moodAlignment)

    return NextResponse.json(moodAnalysis, { status: 200 })
  } catch (error) {
    console.error("Error in mood analysis API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze mood" },
      { status: 500 },
    )
  }
}

