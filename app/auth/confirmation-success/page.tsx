"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { useEffect } from "react"
import { useAuth } from "@/lib/context/auth-context"

export default function ConfirmationSuccessPage() {
  const { refreshSession } = useAuth()

  // Refresh the session when this page loads
  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Email Confirmed!</CardTitle>
          <CardDescription className="text-center">
            Your email has been successfully verified. You can now use all features of MoodTunes.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Thank you for confirming your email address. You are now fully registered.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Link href="/" className="w-full">
            <Button className="w-full">Go to Home Page</Button>
          </Link>
          <Link href="/mood" className="w-full">
            <Button variant="outline" className="w-full">
              Create Your First Mood
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

