# SoundCloud API Configuration Guide

## Getting SoundCloud API Credentials

To use the SoundCloud API in MoodTunes, you need to obtain both a SoundCloud Client ID and Client Secret:

1. Visit the [SoundCloud Developers](https://developers.soundcloud.com/) website
2. Register for a developer account if you don't have one
3. Create a new application
4. Copy your Client ID and Client Secret

## Authentication Flow

SoundCloud uses OAuth 2.1 for authentication. MoodTunes implements the Client Credentials flow, which is appropriate for applications that only need to access public resources like tracks and playlists.

## Setting Up Environment Variables

Add your SoundCloud credentials to your `.env.local` file:

