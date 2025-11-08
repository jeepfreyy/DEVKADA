import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET() {
  try {
    const hasOAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    const hasRefreshToken = process.env.GOOGLE_REFRESH_TOKEN

    if (!hasOAuth || !hasRefreshToken) {
      return NextResponse.json({
        error: 'OAuth credentials not configured',
        hasOAuth,
        hasRefreshToken,
      })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
    )

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })

    // Try to refresh token
    let tokenValid = false
    try {
      await oauth2Client.refreshAccessToken()
      tokenValid = true
    } catch (error: any) {
      return NextResponse.json({
        error: 'Token refresh failed',
        message: error.message,
        suggestion: 'Re-authorize at /api/auth/google',
      })
    }

    // Try to list calendars
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const calendarsResponse = await calendar.calendarList.list()

    // Try to get primary calendar info
    const primaryCalendar = await calendar.calendars.get({
      calendarId: 'primary',
    })

    // List recent events
    const now = new Date()
    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return NextResponse.json({
      success: true,
      tokenValid,
      primaryCalendar: {
        id: primaryCalendar.data.id,
        summary: primaryCalendar.data.summary,
        timeZone: primaryCalendar.data.timeZone,
      },
      calendars: calendarsResponse.data.items?.map((cal) => ({
        id: cal.id,
        summary: cal.summary,
        accessRole: cal.accessRole,
      })),
      recentEvents: eventsResponse.data.items?.map((event) => ({
        id: event.id,
        summary: event.summary,
        start: event.start?.dateTime || event.start?.date,
        htmlLink: event.htmlLink,
      })),
    })
  } catch (error: any) {
    console.error('Calendar test error:', error)
    return NextResponse.json({
      error: 'Calendar test failed',
      message: error.message,
      details: error.toString(),
    }, { status: 500 })
  }
}

