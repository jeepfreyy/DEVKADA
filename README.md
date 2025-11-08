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

# Optional: Google Calendar API (for calendar events)
GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary

# Optional: Resend API Key (for email sending - free tier available)
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

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

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create a Service Account
5. Download JSON credentials
6. Extract `client_email` and `private_key` from JSON
7. Share your calendar with the service account email

### Resend (Optional - for emails)

1. Sign up at [Resend.com](https://resend.com/)
2. Verify your domain (or use their test domain)
3. Get your API key from dashboard
4. Free tier: 3,000 emails/month

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
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

- **Netlify**: Similar to Vercel, supports Next.js
- **Cloudflare Pages**: Free tier available
- **Replit**: Quick deployment option

## 🎯 Demo Video Tips

When creating your demo video:

1. **Show the chat interface** (5 seconds)
2. **Demonstrate calendar event creation** (30 seconds)
   - Type a request
   - Show the action result card
   - Click event link
3. **Show email sending** (30 seconds)
   - Request to send email
   - Show confirmation
4. **Show weather query** (20 seconds)
   - Ask for weather
   - Display results
5. **Show UI generation** (30 seconds)
   - Request UI element
   - Display generated component
6. **Quick actions demo** (20 seconds)
   - Use quick action buttons
7. **Wrap up** (5 seconds)

**Total: ~2.5 minutes**

## 🐛 Troubleshooting

### "OpenRouter API error"
- Check your API key is set correctly
- Verify you have credits/quota available
- Check network connectivity

### "Calendar integration not configured"
- Set up Google Calendar API credentials
- Ensure service account has calendar access
- Check private key format (should include `\n` characters)

### "Email integration not configured"
- Set up Resend API key
- Verify domain (or use test domain)
- Check `RESEND_FROM_EMAIL` matches verified domain

### "Weather API not configured"
- Get OpenWeatherMap API key
- Check API key is valid
- Verify location name is correct

## 📝 License

MIT License - feel free to use this for your hackathon project!

## 🙏 Credits

Built for AI Agent Hackathon with:
- Next.js
- OpenRouter
- Google Calendar API
- Resend
- OpenWeatherMap

---

**Note**: This agent performs real actions beyond just responding. Each interaction can trigger calendar events, send emails, fetch data, or generate UI elements!

