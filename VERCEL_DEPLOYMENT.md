# Vercel Deployment Guide

## Common Issues and Solutions

### 1. API Errors for Multiple Users

**Problem**: Users get API errors when using the app on Vercel.

**Common Causes**:
- Missing environment variables
- Rate limiting from OpenRouter
- Incorrect base URL configuration
- API timeouts

## Step-by-Step Deployment

### Step 1: Set Up Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add **ALL** required environment variables:

#### Required:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

#### Optional (but recommended):
```env
# For production URL (Vercel sets this automatically, but you can override)
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Google Calendar (if using)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback

# Resend (if using)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# Weather (if using)
WEATHER_API_KEY=your_weather_api_key
```

**Important**: 
- Set these for **Production**, **Preview**, and **Development** environments
- After adding variables, **redeploy** your app

### Step 2: Update Google OAuth Redirect URI

If using Google Calendar OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add your Vercel URL to **Authorized redirect URIs**:
   ```
   https://your-app.vercel.app/api/auth/google/callback
   ```
5. Save changes

### Step 3: Handle Rate Limiting

OpenRouter has rate limits. For multiple users:

**Option 1: Use Fallback Mode** (Already implemented)
- If OpenRouter fails, the app uses keyword-based intent detection
- This allows basic functionality even if the API is rate-limited

**Option 2: Upgrade OpenRouter Plan**
- Free tier has rate limits
- Consider upgrading for production use

**Option 3: Add Rate Limiting Protection**
- Implement client-side rate limiting
- Show user-friendly messages when rate-limited

### Step 4: Test Your Deployment

1. **Check Environment Variables**:
   - Visit: `https://your-app.vercel.app/api/test-env`
   - Should show all configured API keys

2. **Test Each Feature**:
   - Try UI generation (works without API keys)
   - Try weather (if configured)
   - Try calendar (if configured)
   - Try email (if configured)

3. **Check Vercel Logs**:
   - Go to **Deployments** → Click on latest deployment → **Functions** tab
   - Check for any errors in the logs

## Common Error Messages and Fixes

### "AI service is not configured"
- **Fix**: Add `OPENROUTER_API_KEY` to Vercel environment variables
- **Redeploy** after adding

### "Rate limit exceeded"
- **Fix**: 
  - Wait a few minutes and try again
  - Consider upgrading OpenRouter plan
  - The app will use fallback mode automatically

### "Invalid API key"
- **Fix**: 
  - Check API key is correct in Vercel
  - Make sure there are no extra spaces
  - Redeploy after fixing

### "Service is busy"
- **Fix**: 
  - This is a rate limit issue
  - Wait and try again
  - App will use fallback mode

### Google Calendar OAuth Errors
- **Fix**: 
  - Make sure redirect URI in Google Console matches your Vercel URL
  - Update `GOOGLE_REDIRECT_URI` in Vercel to match
  - Users need to authorize individually (OAuth is per-user)

## Production Best Practices

### 1. Error Handling
- ✅ Already implemented: User-friendly error messages
- ✅ Already implemented: Fallback mode when APIs fail
- ✅ Already implemented: Graceful degradation

### 2. Rate Limiting
- Consider implementing per-user rate limiting
- Show clear messages when limits are hit
- Use fallback mode as backup

### 3. Monitoring
- Check Vercel logs regularly
- Monitor API usage in OpenRouter dashboard
- Set up alerts for high error rates

### 4. Security
- Never commit API keys to git (already in .gitignore)
- Use Vercel environment variables
- Rotate API keys if exposed

## Troubleshooting

### Users Getting Errors

1. **Check Vercel Logs**:
   ```
   Vercel Dashboard → Your Project → Deployments → Latest → Functions
   ```

2. **Check Environment Variables**:
   - Verify all are set correctly
   - Check for typos
   - Ensure they're set for Production environment

3. **Test API Endpoints**:
   - `/api/test-env` - Check API keys
   - `/api/test-resend` - Test Resend
   - `/api/test-calendar` - Test Calendar

4. **Check Rate Limits**:
   - OpenRouter dashboard shows usage
   - Free tier: Limited requests
   - Consider upgrading for production

### Quick Fixes

**If many users are getting errors**:
1. Check OpenRouter rate limits
2. Verify all environment variables are set
3. Check Vercel function logs
4. Ensure base URL is correct

**If specific features don't work**:
- Calendar: Check OAuth redirect URI matches Vercel URL
- Email: Use `onboarding@resend.dev` for testing
- Weather: Verify API key is set

## Support

If issues persist:
1. Check Vercel function logs
2. Check API provider dashboards (OpenRouter, Resend, etc.)
3. Verify all environment variables
4. Test locally first, then deploy

---

**Remember**: After changing environment variables in Vercel, you **must redeploy** for changes to take effect!

