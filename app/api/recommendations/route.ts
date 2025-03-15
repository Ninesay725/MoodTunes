import { type NextRequest, NextResponse } from "next/server"
import { getRecommendations } from "@/server/actions/music-actions"
import type { MoodAnalysis } from "@/server/types"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate that we have a proper mood analysis object
    if (!data || !data.musicRecommendations || !Array.isArray(data.musicRecommendations.recommendedTracks)) {
      return NextResponse.json(
        {
          error: "Invalid mood analysis data. Missing musicRecommendations or recommendedTracks array.",
        },
        { status: 400 },
      )
    }

    const moodAnalysis = data as MoodAnalysis
    const result = await getRecommendations(moodAnalysis)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json(result.tracks, { status: 200 })
  } catch (error) {
    console.error("Error in recommendations API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get recommendations" },
      { status: 500 },
    )
  }
}

