"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase/client"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string, avatarUrl?: string) => Promise<{ error: any; data: any }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user || null)
      setIsLoading(false)

      // Set up auth state listener
      const {
        data: { subscription },
      } = await supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user || null)
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    fetchSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  // Update the signUp function to better handle existing email errors
  const signUp = async (email: string, password: string, username: string, avatarUrl?: string) => {
    // Make sure username is not empty
    if (!username.trim()) {
      return {
        error: { message: "Username is required" },
        data: null,
      }
    }

    try {
      // Proceed with signup - Supabase will handle the duplicate email check
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            avatar_url: avatarUrl,
          },
        },
      })

      // Check for existing email error in the Supabase response
      if (error) {
        console.error("Signup error from Supabase:", error.message)

        // Specifically check for the "already registered" error
        if (
          error.message?.toLowerCase().includes("already registered") ||
          error.message?.toLowerCase().includes("already in use") ||
          error.message?.toLowerCase().includes("already exists") ||
          error.message?.toLowerCase().includes("unique constraint") ||
          error.message?.toLowerCase().includes("email already")
        ) {
          return {
            error: { message: "This email is already registered. Please sign in instead." },
            data: null,
          }
        }

        // Return any other error
        return { data, error }
      }

      // If signup was successful but we need to verify email, we can still consider it a success
      if (data?.user && !data?.session) {
        console.log("User created, email verification required")
      }

      return { data, error }
    } catch (error) {
      console.error("Error in signUp:", error)
      return {
        error: { message: "An unexpected error occurred during signup" },
        data: null,
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    setSession(session)
    setUser(session?.user || null)
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

