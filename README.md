# AI Agent - Multi-Action Assistant

An intelligent AI agent that understands user intent through natural language chat and performs real-world actions including calendar events, email sending, weather queries, and UI element generation.

## 🎯 Features

- **Natural Language Understanding**: Powered by OpenRouter (GPT-3.5-turbo) to understand user intent
- **Multiple Actions**:
  - 📅 **Google Calendar Integration**: Create and schedule calendar events
  - 📧 **Email Sending**: Send emails via Resend API
  - 🌤️ **Weather Queries**: Get real-time weather information
  - 🎨 **UI Generation**: Generate cards, tables, and timeline views
- **Modern UI**: Beautiful, responsive chat interface with action result cards
- **Quick Actions**: One-click buttons for common tasks

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- API keys for services you want to use (all have free tiers)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
# or
yarn install
```

2. **Set up environment variables:**

Create a `.env.local` file in the root directory:

```env
# Required: OpenRouter API Key (free tier available)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Google Calendar API - OAuth User Account (choose this OR service account below)
GOOGLE_CLIENT_ID=your_client_id_from_oauth_json
GOOGLE_CLIENT_SECRET=your_client_secret_from_oauth_json
GOOGLE_REFRESH_TOKEN=your_refresh_token_from_oauth_flow
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Optional: Google Calendar API - Service Account (choose this OR OAuth above)
# GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
# GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# GOOGLE_CALENDAR_ID=primary

# Optional: Resend API Key (for email sending - free tier available)
RESEND_API_KEY=your_resend_api_key_here
# Use onboarding@resend.dev for testing (no domain verification needed)
# For production, verify your domain in Resend and use your verified email
RESEND_FROM_EMAIL=onboarding@resend.dev

# Optional: Weather API (OpenWeatherMap - free tier available)
WEATHER_API_KEY=your_openweather_api_key_here

# Base URL (for local development, use ngrok for webhooks)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3. **Run the development server:**

```bash
npm run dev
# or
yarn dev
```

4. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 API Key Setup

### OpenRouter (Required)

1. Sign up at [OpenRouter.ai](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Free tier includes access to GPT-3.5-turbo

### Google Calendar (Optional)

You can use either **OAuth (User Account)** or **Service Account**. OAuth is simpler for personal use.

#### Option 1: OAuth User Account (Recommended for personal use)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth client ID**
6. Choose **Web application**
7. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback` (or your deployed URL)
8. Download the JSON file
9. From the JSON file, extract:
   - `client_id` → `GOOGLE_CLIENT_ID`
   - `client_secret` → `GOOGLE_CLIENT_SECRET`
10. Add to `.env.local`:
    ```env
    GOOGLE_CLIENT_ID=your_client_id_here
    GOOGLE_CLIENT_SECRET=your_client_secret_here
    GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
    ```
11. Get refresh token:
    - Visit: `http://localhost:3000/api/auth/google`
    - Authorize the app
    - Copy the refresh token shown
    - Add to `.env.local`: `GOOGLE_REFRESH_TOKEN=your_refresh_token_here`

#### Option 2: Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create a Service Account
5. Download JSON credentials
6. Extract `client_email` and `private_key` from JSON
7. Share your calendar with the service account email
8. Add to `.env.local`:
    ```env
    GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
    GOOGLE_CALENDAR_ID=primary
    ```

### Resend (Optional - for emails)

1. Sign up at [Resend.com](https://resend.com/)
2. Get your API key from dashboard
3. **For testing**: Use `onboarding@resend.dev` as `RESEND_FROM_EMAIL` (no verification needed)
4. **For production**: Verify your domain in Resend dashboard and use your verified domain
5. Free tier: 3,000 emails/month

**Important**: Resend requires verified domains. Free domains (like Vercel's default domains) won't work. Use `onboarding@resend.dev` for testing, or verify your own domain for production.

### OpenWeatherMap (Optional - for weather)

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your free API key
3. Free tier: 60 calls/minute

## 🎬 Usage Examples

### Calendar Event
```
User: "Schedule a meeting tomorrow at 2pm about the project"
Agent: Creates calendar event and shows confirmation with link
```

### Send Email
```
User: "Send an email to john@example.com with subject 'Meeting Confirmation'"
Agent: Sends email and confirms delivery
```

### Weather Query
```
User: "What's the weather in New York?"
Agent: Shows temperature, condition, humidity, and wind speed
```

### Generate UI
```
User: "Generate a card showing project timeline with 3 milestones"
Agent: Creates and displays a visual timeline component
```

## 🏗️ Architecture

- **Frontend**: Next.js 14 with React, TypeScript, Tailwind CSS
- **AI/LLM**: OpenRouter API (GPT-3.5-turbo)
- **Backend**: Next.js API Routes
- **Actions**:
  - Google Calendar API (googleapis)
  - Resend API (email)
  - OpenWeatherMap API (weather)
  - Custom UI generation (HTML/CSS)

## 📁 Project Structure

```
DEVKADA/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Main chat API with intent detection
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page
├── components/
│   ├── ChatInterface.tsx         # Main chat component
│   ├── MessageBubble.tsx         # Message display component
│   └── ActionCard.tsx            # Action result display
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Development

### Local Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Using ngrok for Webhooks

If you need to expose your local server for webhooks:

```bash
ngrok http 3000
```

Update `NEXT_PUBLIC_BASE_URL` with the ngrok URL.

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. **Add ALL environment variables in Vercel dashboard**:
   - Go to Settings → Environment Variables
   - Add all variables from your `.env.local`
   - Set for Production, Preview, and Development
4. **Update Google OAuth redirect URI** (if using Calendar):
   - Add your Vercel URL: `https://your-app.vercel.app/api/auth/google/callback`
5. Deploy!

**Important**: See `VERCEL_DEPLOYMENT.md` for detailed deployment instructions and troubleshooting.

### Other Platforms

- **Netlify**: Similar to Vercel, supports Next.js
- **Cloudflare Pages**: Free tier available
- **Replit**: Quick deployment option
