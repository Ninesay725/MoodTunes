"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Music2, Calendar, User, Home, PlusCircle, LogOut, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/context/auth-context"
import { UserAvatar } from "@/components/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const pathname = usePathname()
  const { user, signOut, isLoading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

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
  ]

  // Check if we're on the mood page or recommendations page
  const isOnMoodPage = pathname === "/mood"
  const isOnRecommendationsPage = pathname.startsWith("/recommendations/")

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
  }

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
        <div className="ml-auto flex items-center">
          {isLoading ? (
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full p-0 overflow-hidden hover:shadow-md transition-shadow mt-0.5"
                >
                  <UserAvatar
                    src={user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.username || user.email || "User"}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata?.username || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          {/* Only show the New Mood button if we're not on the mood page or recommendations page */}
          {!isOnMoodPage && !isOnRecommendationsPage && user && (
            <Link href="/mood" className="ml-2 hidden sm:inline-flex">
              <Button size="sm">
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

