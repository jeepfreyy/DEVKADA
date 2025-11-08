import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'RESEND_API_KEY not configured',
        hasApiKey: false,
      })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    // Try to send a test email to a test address
    // Note: This will actually send an email, so we'll just verify the API key is valid
    // by checking if we can create the client without errors
    
    return NextResponse.json({
      success: true,
      hasApiKey: true,
      fromEmail: fromEmail,
      message: 'Resend API key is configured. Try sending an email through the chat to test.',
      note: 'If emails fail, check: 1) API key is correct, 2) Domain is verified in Resend dashboard, 3) RESEND_FROM_EMAIL uses a verified domain (or use onboarding@resend.dev for testing)',
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Resend test failed',
      message: error.message,
      details: error.toString(),
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { to, subject, body } = await req.json()

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'RESEND_API_KEY not configured',
      }, { status: 400 })
    }

    if (!to) {
      return NextResponse.json({
        error: 'Email address (to) is required',
      }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject || 'Test Email from AI Agent',
      html: `<p>${body || 'This is a test email from your AI Agent.'}</p>`,
    })

    if (error) {
      return NextResponse.json({
        error: 'Failed to send email',
        message: error.message,
        details: error,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: `Email sent successfully to ${to}`,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Email test failed',
      message: error.message,
    }, { status: 500 })
  }
}

