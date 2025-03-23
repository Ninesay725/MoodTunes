"use client"

import { useEffect, useState } from "react"

export function StorageSetup() {
  const [isAvatarBucketSetup, setIsAvatarBucketSetup] = useState(false)
  const [isMoodBucketSetup, setIsMoodBucketSetup] = useState(false)

  useEffect(() => {
    const setupStorage = async () => {
      try {
        // Only run setup once for each bucket
        if (!isAvatarBucketSetup) {
          const avatarResponse = await fetch("/api/storage/create-bucket", {
            method: "POST",
          })

          if (avatarResponse.ok) {
            console.log("Avatar storage setup complete")
            setIsAvatarBucketSetup(true)
          } else {
            console.error("Avatar storage setup failed")
          }
        }

        if (!isMoodBucketSetup) {
          const moodResponse = await fetch("/api/storage/create-mood-bucket", {
            method: "POST",
          })

          if (moodResponse.ok) {
            console.log("Mood images storage setup complete")
            setIsMoodBucketSetup(true)
          } else {
            console.error("Mood images storage setup failed")
          }
        }
      } catch (error) {
        console.error("Error setting up storage:", error)
      }
    }

    setupStorage()
  }, [isAvatarBucketSetup, isMoodBucketSetup])

  // This component doesn't render anything
  return null
}

