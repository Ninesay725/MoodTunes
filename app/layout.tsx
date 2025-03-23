import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/context/auth-context"
import { StorageSetup } from "@/components/storage-setup"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MoodTunes - Music for Your Mood",
  description: "AI-powered music recommendations based on your mood",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <StorageSetup />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'