# Narrativee

> **Grow faster on Substack.** Schedule notes, automate engagement, learn from viral content — all from one dashboard.

---

## What is Narrativee?

Narrativee is a growth toolkit for Substack creators. It combines AI-powered content generation, smart scheduling, and automated engagement to help you grow your audience without spending hours on platform busywork.

**One dashboard. One Chrome extension. Zero manual posting.**

---

## Core Features

### 📅 Scheduled Notes & Post Queue
Write and schedule Substack notes from a visual calendar. Generate notes in bulk with AI that studies your actual writing voice from your publication — or write them manually. The Chrome extension handles auto-publishing at the exact time you set.

- Daily calendar view with drag-and-drop
- AI bulk note generation (learns from your existing Substack posts)
- AI text enhancement (select text → enhance with one click)
- Tone control: casual, professional, witty, inspirational, direct
- Auto-publish via Chrome Extension at scheduled times

### 🤖 Automated Engagement (Engagement Autopilot)
Pull your Substack feed, sort trending notes by engagement, and generate AI-powered contextual comments — then post them with one click. All done through the Chrome extension so comments come from your real Substack account.

- Scrape trending notes from your Substack feed
- Sort by engagement, comments, or recency
- AI-generated human-sounding comments (trained to avoid AI-speak)
- One-click comment posting via Chrome extension
- Track comments posted per session

### ✨ Inspiration Library
Save high-engagement notes from Substack as inspiration. Tag, filter, search, and sort your collection — then add any note directly to your post queue when you're ready to create something similar.

- Save viral/hot notes from Substack via Chrome extension
- Tag and categorize with custom labels
- Filter by engagement (likes, restacks, comments)
- Search across content, authors, and tags
- One-click "Add to Post Queue"

### 📊 Analytics & Metrics
Track your Substack performance from your dashboard. See views, open rates, likes, and comments in one place — synced from the Chrome extension.

- Total views, likes, comments overview
- Average open rate tracking
- Post-level performance metrics
- Data synced from Chrome extension

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Narrativee Stack                        │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │   Web App    │   │   Backend    │   │ Chrome Extension │ │
│  │  (Next.js)   │◄─►│  (Express)   │   │   (Manifest V3)  │ │
│  │   Port 3010  │   │  Port 3002   │   │                  │ │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘ │
│         │                  │                    │           │
│         │    Window.postMessage ◄────────────►  │           │
│         │                  │                    │           │
│         └──────────┬───────┘                    │           │
│                    │                            │           │
│              ┌─────▼─────┐              ┌──────▼──────┐    │
│              │  Supabase  │              │  Substack   │    │
│              │ (Auth + DB)│              │  (Scraping) │    │
│              └────────────┘              └─────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer              | Technology                                |
|--------------------|-------------------------------------------|
| **Frontend**       | Next.js 16, React 19, Tailwind CSS v4     |
| **Backend**        | Express 5, TypeScript, Drizzle ORM        |
| **Auth**           | Better Auth (session-based)               |
| **Database**       | PostgreSQL via Supabase                   |
| **AI**             | Grok 4.1 Fast via OpenRouter              |
| **Payments**       | Stripe (checkout + subscriptions)         |
| **Chrome Extension** | Manifest V3 (content scripts + popup)   |
| **Monorepo**       | Turborepo + pnpm workspaces              |
| **Deploy**         | Cloudflare (OpenNext), Docker (backend)   |

---

## Project Structure

```
apps/
├── web/              # Next.js frontend (dashboard, landing, workspace)
├── backend/          # Express API (auth, posts, substack, pricing)
├── chrome-extension/ # Chrome extension (auto-publish, feed scraper, engagement)
└── docs/             # Documentation

packages/
├── ui/               # Shared UI components
└── ...               # Shared configs (ESLint, TypeScript)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL (or Supabase account)
- Chrome (for extension testing)

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
cp apps/backend/.env.example apps/backend/.env

# Run all apps
pnpm dev
```

This starts:
- **Web app** → `http://localhost:3010`
- **Backend API** → `http://localhost:3002`

### Chrome Extension
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `apps/chrome-extension/`
4. Navigate to Substack — the extension will auto-connect

---

## How It Works

1. **Connect Substack** — Enter your profile URL during onboarding. We import your publication info and writing style.
2. **Generate Content** — Use AI to bulk-generate notes that match your voice, or write them manually.
3. **Schedule & Publish** — Drop notes into time slots on the calendar. The Chrome extension auto-posts them.
4. **Engage Automatically** — Pull trending notes, generate smart comments, and post them to grow your visibility.
5. **Track & Iterate** — Monitor your metrics and refine your strategy with real data.

---

## Roadmap

- [x] Post Queue with daily scheduling
- [x] AI bulk note generation with voice cloning
- [x] Chrome extension auto-publishing
- [x] Engagement Autopilot (AI comments)
- [x] Inspiration library with Chrome extension save
- [x] Analytics dashboard
- [ ] A/B testing different note styles
- [ ] Multi-publication support
- [ ] Mobile app (React Native)
- [ ] Substack API integration (when available)

---

## Contact

Questions? Feedback? Reach out at [contact@narrativee.com](mailto:contact@narrativee.com) or open an issue.
