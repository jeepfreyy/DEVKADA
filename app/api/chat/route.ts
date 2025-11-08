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
      return NextResponse.json(
        { 
          message: 'I understand your request, but I need to check my configuration. Please try again.',
          actionResult: null
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
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return {
      type: 'calendar',
      success: false,
      message: 'Calendar integration not configured. Please set up Google Calendar API credentials.',
      data: null,
    }
  }

  try {
    const { google } = await import('googleapis')
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      undefined,
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/calendar']
    )

    const calendar = google.calendar({ version: 'v3', auth })

    const startDate = params.date
      ? new Date(params.date)
      : new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow by default

    if (params.time) {
      const [hours, minutes] = params.time.split(':').map(Number)
      startDate.setHours(hours, minutes, 0, 0)
    } else {
      startDate.setHours(14, 0, 0, 0) // Default 2pm
    }

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration

    const event = {
      summary: params.title || 'Meeting',
      description: params.description || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC',
      },
    }

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: event,
    })

    return {
      type: 'calendar',
      success: true,
      message: `Calendar event "${event.summary}" created successfully!`,
      data: {
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        startTime: startDate.toISOString(),
      },
    }
  } catch (error) {
    console.error('Calendar error:', error)
    return {
      type: 'calendar',
      success: false,
      message: 'Failed to create calendar event. Please check your credentials.',
      data: null,
    }
  }
}

async function sendEmail(params: any) {
  if (!process.env.RESEND_API_KEY) {
    return {
      type: 'email',
      success: false,
      message: 'Email integration not configured. Please set up Resend API key.',
      data: null,
    }
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: params.to || 'demo@example.com',
      subject: params.subject || 'Message from AI Agent',
      html: `<p>${params.body || 'This is an automated message from your AI Agent.'}</p>`,
    })

    if (error) {
      throw error
    }

    return {
      type: 'email',
      success: true,
      message: `Email sent successfully to ${params.to}!`,
      data: {
        emailId: data?.id,
        to: params.to,
      },
    }
  } catch (error) {
    console.error('Email error:', error)
    return {
      type: 'email',
      success: false,
      message: 'Failed to send email. Please check your Resend API key.',
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
      throw new Error('Weather API error')
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
  } catch (error) {
    console.error('Weather error:', error)
    return {
      type: 'weather',
      success: false,
      message: `Failed to get weather for ${location}. Please check your API key.`,
      data: null,
    }
  }
}

// Fallback intent detection if OpenRouter fails
function detectIntentFallback(message: string): any {
  if (message.includes('calendar') || message.includes('schedule') || message.includes('meeting') || message.includes('event')) {
    // Extract basic params
    const timeMatch = message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i)
    const dateMatch = message.match(/(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)
    const titleMatch = message.match(/(?:about|for|titled?)\s+([^.]+)/i)
    
    return {
      intent: 'calendar',
      message: 'I\'ll create a calendar event for you.',
      params: {
        title: titleMatch ? titleMatch[1].trim() : 'Meeting',
        time: timeMatch ? `${timeMatch[1]}:${timeMatch[2] || '00'}` : undefined,
        date: dateMatch ? dateMatch[1] : undefined,
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

