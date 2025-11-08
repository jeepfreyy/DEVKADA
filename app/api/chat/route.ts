import { NextRequest, NextResponse } from 'next/server'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    const lastMessage = messages[messages.length - 1]?.content || ''

    // Use OpenRouter API to understand intent and determine action
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'X-Title': 'AI Agent Assistant',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // Free tier model
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that helps users by performing actions. Analyze the user's intent and respond with a JSON object containing:
- intent: one of "calendar", "email", "weather", "ui", or "chat"
- message: a friendly response message
- params: extracted parameters based on intent

For calendar: extract title, date, time, description
  - date: can be "tomorrow", "today", day names (monday, tuesday, etc.), month names with day (november 15, nov 15, 15 november), or "next [day]"
  - time: can be "2pm", "2:30pm", "14:00", "9pm", "two pm", etc.
  - title: the meeting/event title or description
  - description: any additional details

For email: extract to, subject, body
For weather: extract location
For ui: extract type (card, table, timeline) and data

If intent is "chat", just respond normally without action.`,
          },
          ...messages.slice(-3), // Last 3 messages for context
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      console.error('OpenRouter error:', errorText)
      let errorMessage = 'I encountered an issue with the AI service.'
      
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) {
          errorMessage = `AI Service Error: ${errorData.error.message}`
        }
      } catch (e) {
        // If not JSON, use the raw error text
        if (errorText.includes('401') || errorText.includes('Unauthorized')) {
          errorMessage = 'Invalid API key. Please check your OPENROUTER_API_KEY in .env.local'
        } else if (errorText.includes('429') || errorText.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.'
        } else {
          errorMessage = `AI Service Error: ${errorText.substring(0, 100)}`
        }
      }
      
      // Fallback to keyword-based intent detection
      const lowerMessage = lastMessage.toLowerCase()
      const assistantResponse = detectIntentFallback(lowerMessage)
      
      let actionResult = null
      if (assistantResponse.intent && assistantResponse.intent !== 'chat') {
        try {
          switch (assistantResponse.intent) {
            case 'calendar':
              actionResult = await createCalendarEvent(assistantResponse.params)
              break
            case 'email':
              actionResult = await sendEmail(assistantResponse.params)
              break
            case 'weather':
              actionResult = await getWeather(assistantResponse.params?.location || 'New York')
              break
            case 'ui':
              actionResult = await generateUI(assistantResponse.params)
              break
          }
        } catch (error) {
          console.error('Action error:', error)
        }
      }
      
      return NextResponse.json(
        { 
          message: `${errorMessage} Using fallback mode.`,
          actionResult
        },
        { status: 200 }
      )
    }

    const openRouterData = await openRouterResponse.json()
    let assistantResponse
    
    try {
      const content = openRouterData.choices[0]?.message?.content || '{"intent":"chat","message":"I understand."}'
      assistantResponse = JSON.parse(content)
    } catch (parseError) {
      // Fallback: simple keyword-based intent detection
      const lowerMessage = lastMessage.toLowerCase()
      assistantResponse = detectIntentFallback(lowerMessage)
    }

    let actionResult = null

    // Perform action based on intent
    if (assistantResponse.intent && assistantResponse.intent !== 'chat') {
      try {
        switch (assistantResponse.intent) {
          case 'calendar':
            actionResult = await createCalendarEvent(assistantResponse.params)
            break
          case 'email':
            actionResult = await sendEmail(assistantResponse.params)
            break
          case 'weather':
            actionResult = await getWeather(assistantResponse.params?.location || 'New York')
            break
          case 'ui':
            actionResult = await generateUI(assistantResponse.params)
            break
        }
      } catch (error) {
        console.error('Action error:', error)
        actionResult = {
          type: assistantResponse.intent,
          success: false,
          message: 'Action failed. Please check your API keys in environment variables.',
          data: null,
        }
      }
    }

    return NextResponse.json({
      message: assistantResponse.message || 'I processed your request.',
      actionResult,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        message: 'Sorry, I encountered an error. Please try again.',
        actionResult: null
      },
      { status: 500 }
    )
  }
}

async function createCalendarEvent(params: any) {
  // Check for OAuth credentials (user account) first
  const hasOAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  const hasRefreshToken = process.env.GOOGLE_REFRESH_TOKEN
  // Check for service account credentials
  const hasServiceAccount = process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY

  if (!hasOAuth && !hasServiceAccount) {
    return {
      type: 'calendar',
      success: false,
      message: 'Calendar integration not configured. Please set up Google Calendar API credentials (either OAuth or Service Account).',
      data: null,
    }
  }

  if (hasOAuth && !hasRefreshToken) {
    return {
      type: 'calendar',
      success: false,
      message: 'Google Calendar OAuth: Missing refresh token. Please visit http://localhost:3000/api/auth/google to authorize and get a refresh token, then add GOOGLE_REFRESH_TOKEN to your .env.local file.',
      data: null,
    }
  }

  try {
    const { google } = await import('googleapis')
    let auth

    if (hasOAuth) {
      // OAuth2 user account authentication
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
      )

      // Set the refresh token and get a fresh access token
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      })

      // Refresh the access token to ensure it's valid
      try {
        const { credentials } = await oauth2Client.refreshAccessToken()
        oauth2Client.setCredentials(credentials)
        console.log('OAuth token refreshed successfully')
      } catch (refreshError: any) {
        console.error('Error refreshing token:', refreshError)
        if (refreshError.message?.includes('invalid_grant')) {
          return {
            type: 'calendar',
            success: false,
            message: 'OAuth token expired or invalid. Please re-authorize at http://localhost:3000/api/auth/google to get a new refresh token.',
            data: null,
          }
        }
        throw refreshError
      }

      auth = oauth2Client
    } else {
      // Service account JWT authentication
      auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        undefined,
        process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/calendar']
      )
    }

    const calendar = google.calendar({ version: 'v3', auth })

    // Parse date - handle various formats
    let startDate = new Date()
    if (params.date) {
      const dateLower = params.date.toLowerCase().trim()
      
      // Handle relative dates
      if (dateLower === 'tomorrow') {
        startDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      } else if (dateLower === 'today') {
        startDate = new Date()
      } else if (dateLower.startsWith('next ')) {
        // Handle "next monday", "next friday", etc.
        const dayName = dateLower.replace('next ', '')
        startDate = getNextDayOfWeek(dayName)
      } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dateLower)) {
        // Handle day names (this week or next)
        startDate = getNextDayOfWeek(dateLower)
      } else {
        // Try to parse month names and dates
        const parsed = parseDateWithMonth(dateLower)
        if (parsed) {
          startDate = parsed
        } else {
          // Try standard date parsing
          const standardParsed = new Date(params.date)
          if (!isNaN(standardParsed.getTime())) {
            startDate = standardParsed
          } else {
            // Default to tomorrow if parsing fails
            startDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        }
      }
    } else {
      // Default to tomorrow
      startDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

    // Parse time
    let hours = 14 // Default 2pm
    let minutes = 0
    
    if (params.time) {
      const timeStr = params.time.toString().toLowerCase().trim()
      
      // Handle formats like "2", "2pm", "14:00", "2:30 PM", "two pm"
      if (timeStr.includes(':')) {
        // Format: "14:00" or "2:30 PM"
        const parts = timeStr.split(':')
        hours = parseInt(parts[0], 10)
        minutes = parseInt(parts[1]?.replace(/\D/g, '') || '0', 10)
        
        // Check for AM/PM
        if (timeStr.includes('pm') && hours < 12) {
          hours += 12
        } else if (timeStr.includes('am') && hours === 12) {
          hours = 0
        }
      } else {
        // Format: "2", "2pm", "14", "two pm"
        const timeMatch = timeStr.match(/(\d+)|(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)/i)
        if (timeMatch) {
          if (timeMatch[1]) {
            // Numeric
            hours = parseInt(timeMatch[1], 10)
          } else if (timeMatch[2]) {
            // Word format
            const wordToNum: { [key: string]: number } = {
              'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
              'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
              'eleven': 11, 'twelve': 12
            }
            hours = wordToNum[timeMatch[2].toLowerCase()] || 14
          }
          
          // Check for PM
          if (timeStr.includes('pm') && hours < 12) {
            hours += 12
          } else if (timeStr.includes('am') && hours === 12) {
            hours = 0
          } else if (!timeStr.includes('am') && !timeStr.includes('pm')) {
            // If no AM/PM specified and hour is 1-12, assume PM
            if (hours >= 1 && hours <= 12) {
              hours = hours === 12 ? 12 : hours + 12
            }
          }
        }
      }
      
      // Validate hours and minutes
      if (isNaN(hours) || hours < 0 || hours > 23) {
        hours = 14 // Default to 2pm
      }
      if (isNaN(minutes) || minutes < 0 || minutes > 59) {
        minutes = 0
      }
    }

    startDate.setHours(hours, minutes, 0, 0)
    
    // Ensure date is in the future
    if (startDate.getTime() < Date.now()) {
      // If time has passed today, move to tomorrow
      startDate.setDate(startDate.getDate() + 1)
    }

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration

    // Use user's timezone instead of UTC
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
    
    const event = {
      summary: params.title || 'Meeting',
      description: params.description || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timeZone,
      },
    }

    // Use 'primary' calendar for OAuth (user's main calendar)
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'
    
    console.log('Creating calendar event:', {
      calendarId,
      summary: event.summary,
      start: event.start.dateTime,
      timeZone: event.start.timeZone,
    })

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    })

    console.log('Event created successfully:', {
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      calendarId: response.data.organizer?.email || calendarId,
    })

    return {
      type: 'calendar',
      success: true,
      message: `Calendar event "${event.summary}" created successfully! Click the link below to view it.`,
      data: {
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        startTime: startDate.toISOString(),
        calendarId: calendarId,
        timeZone: timeZone,
      },
    }
  } catch (error: any) {
    console.error('Calendar error:', error)
    let errorMessage = 'Failed to create calendar event.'
    
    if (error?.message) {
      if (error.message.includes('invalid_grant') || error.message.includes('refresh_token')) {
        errorMessage = 'Google Calendar: Missing or invalid refresh token. Please visit /api/auth/google to authorize and get a refresh token.'
      } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
        errorMessage = 'Google Calendar: Authentication failed. Please check your OAuth credentials or re-authorize at /api/auth/google'
      } else if (error.message.includes('403') || error.message.includes('permission')) {
        errorMessage = 'Google Calendar: Permission denied. Make sure you authorized calendar access.'
      } else {
        errorMessage = `Google Calendar Error: ${error.message}`
      }
    }
    
    return {
      type: 'calendar',
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}

async function sendEmail(params: any) {
  if (!process.env.RESEND_API_KEY) {
    return {
      type: 'email',
      success: false,
      message: 'Email integration not configured. Please set up Resend API key in .env.local',
      data: null,
    }
  }

  // Validate email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const toEmail = params.to || 'demo@example.com'
  
  if (!emailRegex.test(toEmail)) {
    return {
      type: 'email',
      success: false,
      message: `Invalid email address: ${toEmail}. Please provide a valid email address.`,
      data: null,
    }
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    
    console.log('Sending email:', {
      from: fromEmail,
      to: toEmail,
      subject: params.subject || 'Message from AI Agent',
    })

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: params.subject || 'Message from AI Agent',
      html: `<p>${params.body || 'This is an automated message from your AI Agent.'}</p>`,
    })

    if (error) {
      console.error('Resend API error:', error)
      let errorMessage = 'Failed to send email.'
      
      if (error.message) {
        if (error.message.includes('Invalid API key') || error.message.includes('Unauthorized')) {
          errorMessage = 'Resend API: Invalid API key. Please check your RESEND_API_KEY in .env.local'
        } else if (error.message.includes('domain') || error.message.includes('not verified')) {
          errorMessage = `Resend API: Domain not verified. The "from" email (${fromEmail}) must use a verified domain. Check your Resend dashboard or use onboarding@resend.dev for testing.`
        } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
          errorMessage = 'Resend API: Rate limit exceeded. Please try again later.'
        } else {
          errorMessage = `Resend API Error: ${error.message}`
        }
      }
      
      return {
        type: 'email',
        success: false,
        message: errorMessage,
        data: null,
      }
    }

    console.log('Email sent successfully:', {
      emailId: data?.id,
      to: toEmail,
    })

    return {
      type: 'email',
      success: true,
      message: `Email sent successfully to ${toEmail}!`,
      data: {
        emailId: data?.id,
        to: toEmail,
      },
    }
  } catch (error: any) {
    console.error('Email error:', error)
    let errorMessage = 'Failed to send email.'
    
    if (error?.message) {
      errorMessage = `Resend API Error: ${error.message}`
    }
    
    return {
      type: 'email',
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}

async function getWeather(location: string) {
  if (!process.env.WEATHER_API_KEY) {
    return {
      type: 'weather',
      success: false,
      message: 'Weather API not configured. Please set up OpenWeatherMap API key.',
      data: null,
    }
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 401) {
        throw new Error('Invalid API key')
      } else if (response.status === 404) {
        throw new Error(`City "${location}" not found`)
      } else {
        throw new Error(errorData.message || `Weather API error: ${response.status}`)
      }
    }

    const data = await response.json()

    return {
      type: 'weather',
      success: true,
      message: `Weather in ${location}:`,
      data: {
        location: data.name,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
      },
    }
  } catch (error: any) {
    console.error('Weather error:', error)
    let errorMessage = `Failed to get weather for ${location}.`
    
    if (error?.message) {
      if (error.message.includes('401') || error.message.includes('Invalid API key')) {
        errorMessage = `Weather API: Invalid API key. Please check your WEATHER_API_KEY in .env.local`
      } else if (error.message.includes('404') || error.message.includes('city not found')) {
        errorMessage = `Weather API: Location "${location}" not found. Please try a different city name.`
      } else {
        errorMessage = `Weather API Error: ${error.message}`
      }
    }
    
    return {
      type: 'weather',
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}

// Helper function to parse dates with month names
function parseDateWithMonth(dateStr: string): Date | null {
  const months: { [key: string]: number } = {
    'january': 0, 'jan': 0,
    'february': 1, 'feb': 1,
    'march': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'may': 4,
    'june': 5, 'jun': 5,
    'july': 6, 'jul': 6,
    'august': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'december': 11, 'dec': 11,
  }

  // Pattern: "november 15", "nov 15", "15 november", "november 15th"
  const patterns = [
    /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
    /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)/i,
  ]

  for (const pattern of patterns) {
    const match = dateStr.match(pattern)
    if (match) {
      const monthName = match[1]?.toLowerCase() || match[2]?.toLowerCase()
      const day = parseInt(match[2] || match[1], 10)
      const month = months[monthName]

      if (month !== undefined && day >= 1 && day <= 31) {
        const now = new Date()
        const year = now.getFullYear()
        const date = new Date(year, month, day)
        
        // If the date has passed this year, use next year
        if (date < now) {
          date.setFullYear(year + 1)
        }
        
        return date
      }
    }
  }

  return null
}

// Helper function to get next occurrence of a day of week
function getNextDayOfWeek(dayName: string): Date {
  const days: { [key: string]: number } = {
    'sunday': 0, 'sun': 0,
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2, 'tues': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6,
  }

  const targetDay = days[dayName.toLowerCase()]
  if (targetDay === undefined) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow
  }

  const now = new Date()
  const currentDay = now.getDay()
  let daysUntil = targetDay - currentDay

  // If the day has passed this week, get next week's occurrence
  if (daysUntil <= 0) {
    daysUntil += 7
  }

  const nextDate = new Date(now)
  nextDate.setDate(now.getDate() + daysUntil)
  return nextDate
}

// Fallback intent detection if OpenRouter fails
function detectIntentFallback(message: string): any {
  if (message.includes('calendar') || message.includes('schedule') || message.includes('meeting') || message.includes('event')) {
    // Extract date - handle month names, day names, and relative dates
    const monthDateMatch = message.match(/(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?/i)
    const dayNameMatch = message.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i)
    const relativeDateMatch = message.match(/(tomorrow|today|next\s+\w+)/i)
    
    let date: string | undefined
    if (monthDateMatch) {
      // "november 15" format
      date = `${monthDateMatch[1]} ${monthDateMatch[2]}`
    } else if (relativeDateMatch) {
      date = relativeDateMatch[1]
    } else if (dayNameMatch) {
      date = dayNameMatch[1]
    }
    
    // Extract time - handle various formats
    const timeMatch = message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i)
    const wordTimeMatch = message.match(/(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(am|pm)/i)
    
    let time: string | undefined
    if (timeMatch) {
      time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3] || ''}`.trim()
    } else if (wordTimeMatch) {
      const wordToNum: { [key: string]: string } = {
        'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
        'eleven': '11', 'twelve': '12'
      }
      time = `${wordToNum[wordTimeMatch[1].toLowerCase()]} ${wordTimeMatch[2]}`
    }
    
    // Extract title - look for "about", "for", "titled", or after date/time
    const titleMatch = message.match(/(?:about|for|titled?|meeting|event)\s+([^.]+?)(?:\s+on|\s+at|$)/i)
    const afterDateTimeMatch = message.match(/(?:on|at)\s+[^.]+\s+(?:about|for|meeting|event)?\s*([^.]+)/i)
    
    let title = 'Meeting'
    if (titleMatch) {
      title = titleMatch[1].trim()
    } else if (afterDateTimeMatch) {
      title = afterDateTimeMatch[1].trim()
    }
    
    return {
      intent: 'calendar',
      message: 'I\'ll create a calendar event for you.',
      params: {
        title: title,
        time: time,
        date: date,
      },
    }
  }
  
  if (message.includes('email') || message.includes('send') || message.includes('mail')) {
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    const subjectMatch = message.match(/subject[:\s]+["']?([^"']+)["']?/i)
    
    return {
      intent: 'email',
      message: 'I\'ll send an email for you.',
      params: {
        to: emailMatch ? emailMatch[1] : undefined,
        subject: subjectMatch ? subjectMatch[1] : 'Message from AI Agent',
        body: 'This is an automated message from your AI Agent.',
      },
    }
  }
  
  if (message.includes('weather') || message.includes('temperature') || message.includes('forecast')) {
    const locationMatch = message.match(/(?:in|at|for)\s+([A-Z][a-zA-Z\s]+?)(?:\?|$|\.)/)
    
    return {
      intent: 'weather',
      message: 'I\'ll check the weather for you.',
      params: {
        location: locationMatch ? locationMatch[1].trim() : 'New York',
      },
    }
  }
  
  if (message.includes('generate') || message.includes('create') || message.includes('show') || message.includes('card') || message.includes('table') || message.includes('timeline')) {
    let type = 'card'
    if (message.includes('table')) type = 'table'
    else if (message.includes('timeline')) type = 'timeline'
    
    return {
      intent: 'ui',
      message: `I'll generate a ${type} for you.`,
      params: {
        type,
        data: {},
      },
    }
  }
  
  return {
    intent: 'chat',
    message: 'I understand. How can I help you?',
    params: {},
  }
}

async function generateUI(params: any) {
  const { type = 'card', data = {} } = params

  let html = ''

  switch (type) {
    case 'card':
      html = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; color: white;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">${data.title || 'Card Title'}</h3>
          <p style="margin: 0; opacity: 0.9;">${data.content || 'Card content goes here'}</p>
        </div>
      `
      break
    case 'table':
      const rows = data.rows || [
        ['Task', 'Status'],
        ['Project Setup', 'Complete'],
        ['API Integration', 'In Progress'],
      ]
      html = `
        <table style="width: 100%; border-collapse: collapse; background: white; color: #333;">
          ${rows.map((row: string[], idx: number) => `
            <tr style="${idx === 0 ? 'background: #667eea; color: white; font-weight: bold;' : 'border-bottom: 1px solid #ddd;'}">
              ${row.map((cell: string) => `<td style="padding: 10px;">${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </table>
      `
      break
    case 'timeline':
      const milestones = data.milestones || [
        { title: 'Phase 1', status: 'Complete' },
        { title: 'Phase 2', status: 'In Progress' },
        { title: 'Phase 3', status: 'Pending' },
      ]
      html = `
        <div style="position: relative; padding-left: 30px;">
          ${milestones.map((milestone: any, idx: number) => `
            <div style="position: relative; margin-bottom: 20px;">
              <div style="position: absolute; left: -25px; top: 0; width: 12px; height: 12px; border-radius: 50%; background: ${milestone.status === 'Complete' ? '#10b981' : milestone.status === 'In Progress' ? '#f59e0b' : '#6b7280'};"></div>
              ${idx < milestones.length - 1 && '<div style="position: absolute; left: -19px; top: 12px; width: 2px; height: 20px; background: #e5e7eb;"></div>'}
              <div>
                <h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: white;">${milestone.title}</h4>
                <span style="font-size: 12px; color: rgba(255,255,255,0.7);">${milestone.status}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `
      break
    default:
      html = `<div style="padding: 20px; background: white; border-radius: 8px; color: #333;">${data.content || 'UI Element'}</div>`
  }

  return {
    type: 'ui',
    success: true,
    message: `Generated ${type} UI element`,
    data: {
      html,
      type,
    },
  }
}

