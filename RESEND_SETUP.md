# Resend Email Setup Guide

## Quick Setup for Testing

Resend requires **verified domains** to send emails. Free domains (like Vercel's default domains) **will not work**.

### Option 1: Use Resend's Test Domain (Recommended for Testing)

1. Sign up at [Resend.com](https://resend.com/)
2. Get your API key from the dashboard
3. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```
4. **No domain verification needed!** This works immediately for testing.

### Option 2: Verify Your Own Domain (For Production)

1. Sign up at [Resend.com](https://resend.com/)
2. Go to **Domains** in the dashboard
3. Add your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides to your domain
5. Wait for verification (usually a few minutes)
6. Once verified, use your domain:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

## Why Free Domains Don't Work

Resend requires you to verify domain ownership through DNS records. Free domains like:
- `*.vercel.app`
- `*.netlify.app`
- `*.github.io`

Cannot be verified because you don't control their DNS settings.

## Testing Your Setup

1. **Check API key**: Visit http://localhost:3000/api/test-resend
2. **Send test email**: In the chat, say:
   - "Send an email to your-email@example.com with subject 'Test'"
3. **Check server logs**: Look for "Sending email:" and "Email sent successfully" messages

## Common Issues

### "Domain not verified"
- **Solution**: Use `onboarding@resend.dev` for testing, or verify your domain in Resend dashboard

### "Invalid API key"
- **Solution**: 
  - Check your API key starts with `re_`
  - Make sure there are no extra spaces or quotes in `.env.local`
  - Restart your server after adding the key

### "Rate limit exceeded"
- **Solution**: Resend free tier is 3,000 emails/month. Wait or upgrade your plan.

## Production Deployment

For production:
1. Verify your own domain in Resend
2. Update `RESEND_FROM_EMAIL` to use your verified domain
3. Make sure to add the environment variable in your hosting platform (Vercel, Netlify, etc.)

---

**Quick Start**: Just use `onboarding@resend.dev` for testing - it works immediately!

