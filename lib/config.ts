// Environment configuration with proper type checking and defaults

// Server-side environment variables
export const serverConfig = {
  // Google API key for Gemini AI
  googleApiKey: process.env.GOOGLE_API_KEY || "",

  // SoundCloud API credentials
  soundcloudClientId: process.env.NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID || "",
  soundcloudClientSecret: process.env.SOUNDCLOUD_CLIENT_SECRET || "",

  // Base URL for the application
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",

  // Environment
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
}

// Client-side environment variables (only expose what's needed)
export const clientConfig = {
  // SoundCloud client ID (public)
  soundcloudClientId: process.env.NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID || "",

  // Base URL for the application
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",

  // Environment
  isDevelopment: process.env.NODE_ENV === "development",
}

// Validate required environment variables
export function validateServerConfig(): { valid: boolean; missingVars: string[] } {
  const requiredVars = [
    { name: "GOOGLE_API_KEY", value: serverConfig.googleApiKey },
    { name: "SOUNDCLOUD_CLIENT_SECRET", value: serverConfig.soundcloudClientSecret },
    { name: "NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID", value: serverConfig.soundcloudClientId },
  ]

  const missingVars = requiredVars.filter((v) => !v.value).map((v) => v.name)

  return {
    valid: missingVars.length === 0,
    missingVars,
  }
}

