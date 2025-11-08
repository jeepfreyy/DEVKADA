import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasWeatherApi: !!process.env.WEATHER_API_KEY,
    // Don't expose actual keys, just show if they exist
    openRouterPrefix: process.env.OPENROUTER_API_KEY?.substring(0, 10) + '...',
  })
}

