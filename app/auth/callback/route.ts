import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const tokenHash = requestUrl.searchParams.get("token_hash")

  console.log("Callback URL:", request.url)
  console.log("Code:", code)
  console.log("Type:", type)
  console.log("Token Hash exists:", !!tokenHash)

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Handle code-based auth (OAuth, magic link)
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Handle token-based auth (password reset)
  if (tokenHash && type === "recovery") {
    // For password reset, redirect to the reset page with the token hash in the URL
    return NextResponse.redirect(new URL(`/auth/reset-password?token_hash=${tokenHash}&type=${type}`, request.url))
  } else if (type === "signup" && tokenHash) {
    // For email confirmation, verify the token
    const { error } = await supabase.auth.verifyOtp({
      type: "signup",
      token_hash: tokenHash,
    })

    if (!error) {
      return NextResponse.redirect(new URL("/auth/confirmation-success", request.url))
    }
  }

  // Default redirect to home page
  return NextResponse.redirect(new URL("/", request.url))
}

