# Amazon Price Alert

Minimal price-check + email notifier. No dashboard, no history, no AI.
Paste one Amazon product URL + your email once → get a price email at
10 AM and 6 PM IST every day, automatically, forever, on Vercel's free plan.

## How it works

- `/` — one-time form: Amazon URL + email → saved to Redis (Vercel KV / Upstash).
- `/api/config` — GET/POST for that saved config.
- `/api/check-price` — hit by Vercel Cron twice a day. Reads config, asks
  Keepa for the current price, emails you via Resend.

## Deploy steps

### 1. Push this folder to a GitHub repo, then import it in Vercel.

### 2. Add storage
In your Vercel project → **Storage** → add a **Redis** (Upstash) database
and connect it to the project. This auto-injects `KV_REST_API_URL` and
`KV_REST_API_TOKEN` — you don't need to set those by hand.

### 3. Get a Keepa API key
Sign up at keepa.com → Settings → API. Free tier gives a small number of
tokens/day, which is enough for one product checked twice daily.

### 4. Get a Resend API key
Sign up at resend.com (free tier: 3,000 emails/month). Grab an API key.
You can send from `onboarding@resend.dev` with no domain setup — good enough
for personal alerts.

### 5. Set environment variables in Vercel
Project → Settings → Environment Variables:

```
KEEPA_API_KEY=your_keepa_key
RESEND_API_KEY=your_resend_key
NOTIFY_FROM_EMAIL=onboarding@resend.dev
```
(`KV_REST_API_URL` / `KV_REST_API_TOKEN` are added automatically in step 2.)

### 6. Deploy
Vercel will pick up `vercel.json` automatically and register the two cron
jobs (10:00 AM and 6:00 PM IST). Cron jobs only run on deployed
(production) projects, not preview deployments.

### 7. Use it
Visit your deployed URL, paste an amazon.in product link (`.../dp/ASIN...`)
and your email, hit Save. That's it — no more code, no more redeploys.

## Notes / limits

- **One product only**, by design (V1 scope).
- If Keepa has no price data yet for a brand-new ASIN, the cron run just
  logs an error and skips sending — it won't email garbage.
- Keepa domain is hardcoded to `10` (amazon.in) since prices are shown in ₹.
  If you ever need amazon.com, change `KEEPA_DOMAIN` in
  `app/api/check-price/route.ts`.
- You can trigger `/api/check-price` manually (just visit the URL) to test
  without waiting for the cron.
