"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  src?: string | null
  alt?: string
  className?: string
  size?: "sm" | "md" | "lg"
  fallback?: React.ReactNode
}

export function UserAvatar({ src, alt = "User avatar", className, size = "md", fallback }: UserAvatarProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src || null)
  const [error, setError] = useState(false)

  // Reset error state if src changes
  useEffect(() => {
    setImgSrc(src || null)
    setError(false)
  }, [src])

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  }

  const handleError = () => {
    setError(true)
  }

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-muted flex items-center justify-center",
        sizeClasses[size],
        className,
      )}
    >
      {imgSrc && !error ? (
        <Image src={imgSrc || "/placeholder.svg"} alt={alt} fill className="object-cover" onError={handleError} />
      ) : fallback ? (
        fallback
      ) : (
        <User
          className={cn("text-muted-foreground", size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8")}
        />
      )}
    </div>
  )
}

