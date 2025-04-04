# MoodTunes

MoodTunes is an AI-powered music recommendation app that uses Gemini 2.5 Pro Preview (03-25) to analyze your mood and suggest personalized music playlists through SoundCloud integration.

## Features

- Natural language mood input
- AI-powered mood analysis using Gemini 2.5 Pro Preview (03-25)
- Personalized music recommendations based on mood
- User preferences for music style, language, and source
- Mood history calendar with date tracking
- SoundCloud integration for playing recommended tracks
- User authentication and profiles with Supabase
- Responsive modern UI with Shadcn UI components

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **AI**: Google Generative AI (Gemini 2.5 Pro Preview 03-25)
- **Authentication & Database**: Supabase
- **Music Integration**: SoundCloud API
- **UI Components**: Shadcn UI, Radix UI, Lucide icons

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your environment variables in `.env.local`
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file with the following variables:

```
# Google API Key for Gemini AI (Required)
GOOGLE_API_KEY=your_google_api_key

# SoundCloud API Credentials (Required for music recommendations)
NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Base URL for the application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## How It Works

1. **Describe Your Mood**: Tell the app how you're feeling in your own words.
2. **AI Analysis**: Gemini 2.5 Pro Preview (03-25) analyzes your emotions to understand your mood.
3. **Music Recommendations**: Get a curated playlist from SoundCloud that matches your emotional state.
4. **Track Your Mood**: View your mood history on a calendar and see how your emotions change over time.

## Project Structure

The project follows a modern Next.js application structure:
- `/app`: Next.js app router pages and API routes
- `/components`: Reusable UI components
- `/lib`: Utility functions and services
- `/server`: Server-side code and API services
- `/db`: Some database schemas for Supabase


