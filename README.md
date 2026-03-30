# 🏀 Knicks Hub

A New York Knicks fan dashboard built with Next.js and Tailwind CSS. Live standings, schedule, a playoff scenario tool, and Knicks news — all in one place.

## Pages

| Page | URL | What it does |
|---|---|---|
| Home | `/` | Team record, East seed, next game |
| Standings | `/standings` | Full Eastern Conference standings table |
| Schedule | `/schedule` | Last 10 results + next 10 upcoming games |
| What-If | `/whatif` | Interactive playoff scenario simulator |
| News | `/news` | Latest Knicks headlines via GNews |

---

## Running Locally

### 1. Install dependencies

```bash
cd knicks-hub
npm install
```

### 2. Add your GNews API key (optional — for the News page)

1. Go to [gnews.io](https://gnews.io) and sign up for a free account
2. Copy your API key from the dashboard
3. Open the file `.env.local` in the project folder
4. Replace the empty value so it looks like this:

```
GNEWS_API_KEY=abc123yourkeyhere
```

The News page will work with a placeholder message until you add the key — all other pages work without it.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying to Vercel

Vercel is the easiest way to get this live on the internet for free.

### Step-by-step

1. **Push your code to GitHub**
   - Create a new repository on github.com
   - In your project folder, run:
     ```bash
     git add .
     git commit -m "Initial Knicks Hub"
     git remote add origin https://github.com/YOUR_USERNAME/knicks-hub.git
     git push -u origin main
     ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign up (free)
   - Click **"Add New Project"**
   - Select your `knicks-hub` GitHub repository
   - Click **Deploy**

3. **Add your GNews API key to Vercel**
   - In your Vercel project dashboard, go to **Settings → Environment Variables**
   - Add a variable:
     - Name: `GNEWS_API_KEY`
     - Value: your key from gnews.io
   - Click **Save** and then **Redeploy**

That's it! Vercel automatically rebuilds your site whenever you push new code to GitHub.

---

## Data Sources

- **NBA Data**: [balldontlie.io](https://www.balldontlie.io) — free, no API key required
- **News**: [GNews](https://gnews.io) — free tier (10 results per request, 100 requests/day)

Data is cached by Next.js:
- Standings & schedule: **24 hours** (refreshed daily)
- News: **1 hour** (refreshed hourly)

---

## Project Structure

```
knicks-hub/
├── app/
│   ├── layout.tsx        ← Shared layout (NavBar lives here)
│   ├── page.tsx          ← Home page
│   ├── standings/page.tsx
│   ├── schedule/page.tsx
│   ├── whatif/page.tsx
│   └── news/page.tsx
├── components/
│   ├── NavBar.tsx        ← Navigation bar
│   └── WhatIfTool.tsx    ← Interactive scenario tool
├── lib/
│   ├── nba.ts            ← All balldontlie API calls
│   └── news.ts           ← GNews API call
├── .env.local            ← Your secret keys (never commit this)
└── README.md
```

---

*Not affiliated with the New York Knicks or the NBA.*
