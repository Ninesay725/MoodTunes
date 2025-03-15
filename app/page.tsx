import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Music2, Calendar, Heart } from "lucide-react"
import { Navbar } from "@/components/navbar"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Music that matches your mood
                </h1>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  MoodTunes uses Gemini 2.0 Flash AI to analyze your emotions and recommend the perfect music to match
                  how you feel. Track your mood journey and discover new music tailored just for you.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/mood">
                    <Button size="lg" className="w-full min-[400px]:w-auto">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/calendar">
                    <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                      View Mood Calendar
                      <Calendar className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto lg:ml-auto flex justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute -left-4 -top-4 h-72 w-72 bg-primary/20 rounded-full blur-3xl" />
                  <div className="absolute -right-4 -bottom-4 h-72 w-72 bg-secondary/20 rounded-full blur-3xl" />
                  <div className="relative rounded-xl border bg-background p-6 shadow-lg">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">Today's Mood</h3>
                        <p className="text-gray-500">How are you feeling today?</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border bg-card p-3 text-center shadow-sm">
                          <Heart className="mx-auto h-8 w-8 text-red-500" />
                          <span className="text-sm font-medium">Happy</span>
                        </div>
                        <div className="rounded-lg border bg-card p-3 text-center shadow-sm">
                          <Music2 className="mx-auto h-8 w-8 text-blue-500" />
                          <span className="text-sm font-medium">Relaxed</span>
                        </div>
                        <div className="rounded-lg border bg-card p-3 text-center shadow-sm">
                          <Music2 className="mx-auto h-8 w-8 text-yellow-500" />
                          <span className="text-sm font-medium">Energetic</span>
                        </div>
                        <div className="rounded-lg border bg-card p-3 text-center shadow-sm">
                          <Music2 className="mx-auto h-8 w-8 text-purple-500" />
                          <span className="text-sm font-medium">Focused</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  MoodTunes combines AI and music to create the perfect soundtrack for your emotions.
                </p>
              </div>
              <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-xl font-bold">Describe Your Mood</h3>
                  <p className="text-gray-500">Tell us how you're feeling in your own words.</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="text-xl font-bold">AI Analysis</h3>
                  <p className="text-gray-500">
                    Our Gemini 2.0 Flash AI analyzes your emotions to understand your mood.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="text-xl font-bold">Personalized Music</h3>
                  <p className="text-gray-500">Get a curated playlist that matches your emotional state.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} MoodTunes. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-gray-500 hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

