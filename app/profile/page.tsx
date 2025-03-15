"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Music2, User, Settings } from "lucide-react"
import { Navbar } from "@/components/navbar"

export default function ProfilePage() {
  const [settings, setSettings] = useState({
    saveHistory: true,
    darkMode: false,
    autoPlay: true,
    createPlaylists: false,
  })

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <>
      <Navbar />
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account
              </CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Email</h3>
                <p className="text-sm text-muted-foreground">user@example.com</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Member Since</h3>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Edit Profile</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music2 className="h-5 w-5" />
                Music Services
              </CardTitle>
              <CardDescription>Connect your music streaming accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">SoundCloud</h3>
                    <p className="text-sm text-muted-foreground">Connect to get personalized recommendations</p>
                  </div>
                  <Button>
                    <Music2 className="mr-2 h-4 w-4" />
                    Connect with SoundCloud
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>Customize your MoodTunes experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="save-history">Save Mood History</Label>
                    <p className="text-sm text-muted-foreground">Store your mood entries and music recommendations</p>
                  </div>
                  <Switch
                    id="save-history"
                    checked={settings.saveHistory}
                    onCheckedChange={(checked) => updateSetting("saveHistory", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Use dark theme for the application</p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => updateSetting("darkMode", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-play">Auto-play Previews</Label>
                    <p className="text-sm text-muted-foreground">Automatically play song previews when available</p>
                  </div>
                  <Switch
                    id="auto-play"
                    checked={settings.autoPlay}
                    onCheckedChange={(checked) => updateSetting("autoPlay", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="create-playlists">Create Spotify Playlists</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create Spotify playlists from recommendations
                    </p>
                  </div>
                  <Switch
                    id="create-playlists"
                    checked={settings.createPlaylists}
                    onCheckedChange={(checked) => updateSetting("createPlaylists", checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}

