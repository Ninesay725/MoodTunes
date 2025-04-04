"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"

export async function resetPassword(formData: FormData) {
  const password = formData.get("password") as string

  if (!password || password.length < 6) {
    return {
      error: "Password must be at least 6 characters",
    }
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Get the token hash from the cookie
    const tokenHash = cookieStore.get("supabase-reset-token-hash")?.value

    if (!tokenHash) {
      return {
        error: "Your password reset link has expired. Please request a new one.",
      }
    }

    // Verify the token and update the password
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
      new_password: password,
    })

    if (error) {
      console.error("Password reset error:", error)
      return {
        error: error.message || "Failed to reset password. Please try again.",
      }
    }

    // Clear the token cookie after successful password reset
    cookieStore.delete("supabase-reset-token-hash")

    return { success: true }
  } catch (error) {
    console.error("Unexpected error during password reset:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

