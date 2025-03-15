"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Music2, Calendar, User, Home, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "New Mood",
      href: "/mood",
      icon: <PlusCircle className="h-5 w-5" />,
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
    },
  ]

  // Check if we're on the mood page or recommendations page
  const isOnMoodPage = pathname === "/mood"
  const isOnRecommendationsPage = pathname.startsWith("/recommendations/")

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Music2 className="h-6 w-6 text-primary" />
          <span className="text-xl hidden sm:inline-block">MoodTunes</span>
        </Link>
        <nav className="mx-auto flex items-center gap-1 sm:gap-6 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-md transition-colors hover:text-primary",
                pathname === item.href ? "text-primary font-medium" : "text-muted-foreground",
              )}
            >
              <span className="sm:hidden">{item.icon}</span>
              <span className="hidden sm:inline-block">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          {/* Only show the New Mood button if we're not on the mood page or recommendations page */}
          {!isOnMoodPage && !isOnRecommendationsPage && (
            <Link href="/mood">
              <Button size="sm" className="hidden sm:flex">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Mood
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

