# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment Variables

Create `.env.local` file:

```env
# Minimum required - OpenRouter API Key
OPENROUTER_API_KEY=your_key_here
```

**Get OpenRouter API Key:**
1. Go to https://openrouter.ai/
2. Sign up (free)
3. Get API key from dashboard
4. Free tier includes GPT-3.5-turbo access

### Step 3: Run the App
```bash
npm run dev
```

### Step 4: Test It Out!

Open http://localhost:3000 and try:
- "What's the weather in New York?" (works without extra setup)
- "Generate a card showing project timeline" (works without extra setup)
- "Schedule a meeting tomorrow at 2pm" (needs Google Calendar setup)
- "Send an email to test@example.com" (needs Resend setup)

## ✅ What Works Out of the Box

Even with just the OpenRouter API key, you can:
- ✅ Chat with the AI
- ✅ Generate UI elements (cards, tables, timelines)
- ✅ Basic intent detection

## 🔧 Optional Integrations

### Google Calendar (for calendar events)
1. Google Cloud Console → Create project
2. Enable Calendar API
3. Create Service Account
4. Download JSON, extract credentials
5. Share calendar with service account email

### Resend (for emails)
1. Sign up at resend.com
2. Verify domain (or use test domain)
3. Get API key

### OpenWeatherMap (for weather)
1. Sign up at openweathermap.org
2. Get free API key
3. Add to `.env.local`

## 🎥 Demo Tips

1. **Start with UI generation** - Works immediately, looks impressive
2. **Show weather** - Quick, visual result
3. **Show calendar** - If configured, demonstrates real action
4. **Show email** - If configured, demonstrates real action

## 🐛 Troubleshooting

**"OpenRouter API error"**
- Check API key is correct
- Ensure you have credits/quota
- Try the fallback mode (it should still work!)

**Actions not working?**
- Check console for error messages
- Verify API keys in `.env.local`
- Some actions require additional setup (see Optional Integrations)

