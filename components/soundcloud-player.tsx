"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

interface SoundCloudPlayerProps {
  embedUrl: string
  title: string
}

export default function SoundCloudPlayer({ embedUrl, title }: SoundCloudPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const handleLoad = () => {
      setIsLoading(false)
    }

    const iframe = iframeRef.current
    if (iframe) {
      iframe.addEventListener("load", handleLoad)
    }

    return () => {
      if (iframe) {
        iframe.removeEventListener("load", handleLoad)
      }
    }
  }, [])

  if (!embedUrl) {
    return null
  }

  return (
    <div className="relative w-full h-[80px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        width="100%"
        height="80"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={embedUrl}
        title={`SoundCloud player for ${title}`}
        className="w-full"
      ></iframe>
    </div>
  )
}

