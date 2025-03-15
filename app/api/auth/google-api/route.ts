import { NextResponse } from "next/server"

export async function GET() {
  // Only expose the API key, not the entire environment
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Google API key is not configured" }, { status: 500 })
  }

  return NextResponse.json({ apiKey })
}

