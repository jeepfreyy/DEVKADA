import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      // Show helpful HTML page if accessed directly
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Setup</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              h1 { color: #ea4335; }
              .info {
                background: #e3f2fd;
                padding: 15px;
                border-radius: 4px;
                margin: 20px 0;
                border-left: 4px solid #2196f3;
              }
              .button {
                display: inline-block;
                background: #1a73e8;
                color: white;
                padding: 12px 24px;
                border-radius: 4px;
                text-decoration: none;
                margin: 10px 0;
              }
              .button:hover {
                background: #1557b0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚠️ OAuth Setup Required</h1>
              
              <div class="info">
                <p><strong>You accessed the callback URL directly.</strong></p>
                <p>To get your refresh token, you need to start the OAuth flow from the beginning:</p>
                <ol>
                  <li>Click the button below to start authorization</li>
                  <li>Google will ask you to authorize the app</li>
                  <li>After authorization, you'll be redirected back here with your refresh token</li>
                </ol>
              </div>

              <a href="/api/auth/google" class="button">Start Google OAuth Authorization</a>
              
              <p style="margin-top: 30px;">
                <a href="/" style="color: #1a73e8;">← Back to Chat</a>
              </p>
            </div>
          </body>
        </html>
      `
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'OAuth credentials not configured' },
        { status: 500 }
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    )

    const { tokens } = await oauth2Client.getToken(code)
    
    // Display the refresh token to the user
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Success</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 { color: #34a853; }
            .token-box {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 4px;
              border: 1px solid #ddd;
              word-break: break-all;
              font-family: monospace;
              margin: 20px 0;
            }
            .instructions {
              background: #e8f5e9;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
            .warning {
              background: #fff3cd;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
              border-left: 4px solid #ffc107;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ OAuth Authorization Successful!</h1>
            
            <div class="instructions">
              <h3>Add this to your .env.local file:</h3>
              <div class="token-box">
                GOOGLE_REFRESH_TOKEN=${tokens.refresh_token || 'No refresh token - you may need to revoke and re-authorize'}
              </div>
            </div>

            ${tokens.refresh_token ? '' : `
            <div class="warning">
              <strong>⚠️ No refresh token received!</strong><br>
              This usually happens if you've already authorized the app before.<br>
              To get a refresh token:
              <ol>
                <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a></li>
                <li>Revoke access for this app</li>
                <li>Try the authorization flow again</li>
              </ol>
            </div>
            `}

            <p><strong>Access Token:</strong> (expires in 1 hour, refresh token is what you need)</p>
            <div class="token-box" style="font-size: 12px;">
              ${tokens.access_token?.substring(0, 50)}...
            </div>

            <p style="margin-top: 30px;">
              <a href="/" style="color: #1a73e8;">← Back to Chat</a>
            </p>
          </div>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.json(
      { error: 'Failed to complete OAuth flow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

