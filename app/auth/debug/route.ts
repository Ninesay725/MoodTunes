import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("Debug route hit:", request.url)

  // Return a simple text response
  return new NextResponse("Debug route working! Check server logs.", {
    headers: { "Content-Type": "text/plain" },
  })
}

