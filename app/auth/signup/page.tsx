"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Upload } from "lucide-react"
import { uploadAvatar } from "@/lib/supabase/storage"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { signUp } = useAuth()
  const router = useRouter()

  // Ensure storage is set up
  useEffect(() => {
    const setupStorage = async () => {
      try {
        await fetch("/api/storage/create-bucket", {
          method: "POST",
        })
      } catch (error) {
        console.error("Error setting up storage:", error)
      }
    }

    setupStorage()
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar image must be less than 2MB")
      return
    }

    // Check file type
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setError("Avatar must be an image (JPEG, PNG, GIF, or WebP)")
      return
    }

    setAvatarFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Add this function before the handleSubmit function
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        // If the API fails, we'll proceed with signup and let Supabase handle it
        console.error("Failed to check email:", response.statusText)
        return false
      }

      const data = await response.json()
      return data.exists
    } catch (error) {
      console.error("Error checking email:", error)
      return false
    }
  }

  // Update the beginning of the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate inputs
      if (!email || !password || !username) {
        setError("Email, password, and username are required")
        setIsLoading(false)
        return
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        setIsLoading(false)
        return
      }

      // Check if email already exists
      const emailExists = await checkEmailExists(email)
      if (emailExists) {
        setError("This email is already registered. Please sign in instead.")
        setIsLoading(false)
        return
      }

      // Upload avatar if provided - but make it optional for signup
      let avatarUrl: string | undefined
      if (avatarFile) {
        try {
          // We'll use a temporary ID for the upload path
          const tempId = `temp_${Date.now()}`
          const uploadedUrl = await uploadAvatar(avatarFile, tempId)
          if (uploadedUrl) {
            avatarUrl = uploadedUrl
          } else {
            console.warn("Avatar upload failed, continuing with signup without avatar")
          }
        } catch (uploadErr) {
          console.error("Avatar upload error:", uploadErr)
          // Continue with signup even if avatar upload fails
        }
      }

      // Sign up the user
      const { error: signUpError, data } = await signUp(email, password, username, avatarUrl)

      // If there's an error, display it and don't redirect
      if (signUpError) {
        console.error("Signup error:", signUpError.message)
        setError(signUpError.message || "Failed to create account")
        setIsLoading(false)
        return
      }

      // Check if we have a user but no session (email confirmation required)
      if (data?.user && !data?.session) {
        // Only redirect to confirmation page if there's no error
        router.push("/auth/confirmation")
      } else if (data?.session) {
        // If we have a session, user is logged in, redirect to home
        router.push("/")
      } else {
        // Something unexpected happened
        setError("Something went wrong. Please try again.")
      }
    } catch (err) {
      console.error("Sign up error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your details below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Profile Picture (Optional)</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview || "/placeholder.svg"}
                      alt="Avatar preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                      <Upload className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  Choose Image
                </Button>
                <input
                  ref={fileInputRef}
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Max file size: 2MB. Supported formats: JPEG, PNG, GIF, WebP
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </div>
          <div className="text-sm text-center">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

