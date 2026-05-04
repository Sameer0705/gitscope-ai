## What is GitScope AI?

GitScope AI is a full-stack web app that takes any public GitHub username and gives you a complete developer analysis — powered by real GitHub data and Groq AI.

### Features

- 📊 **AI Report Card** — grades the developer A–F on code variety, popularity, activity and profile polish
- 🔥 **Savage Roast** — a Comedy Central-style roast written by AI based on their actual stats
- 🎴 **Shareable Roast Card** — download a clean dark card to post on Twitter/Instagram
- 🗓️ **Commit Activity Heatmap** — visual 13-week commit history
- 🔵 **Language Breakdown Chart** — pie chart of every language they have used
- ⚔️ **Unified Battle Mode** — three ways to battle two devs:
  - One specific repo each
  - Multiple repos with combined, best, or ranked judging
  - Whole GitHub profile vs whole profile
- 🔥 **Hall of Flame Leaderboard** — four live tabs:
  - Most Roasted devs
  - Most Battled devs
  - Win Rate rankings
  - Top Starred repo holders

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Frontend | React + Vite |
| Charts | Recharts |
| GitHub Data | GitHub REST API |
| AI | Groq API (llama-3.1-8b-instant) |
| Image Export | html2canvas |
| Environment | dotenv |

---

## Project Structure

```
gitscope-ai/
├── server/
│   ├── server.js          # Express server + all API routes
│   ├── leaderboard.json   # Auto-generated — roast tracking
│   ├── battles.json       # Auto-generated — battle tracking
│   └── .env               # Secret keys (never commit this)
├── client/
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       └── components/
│           ├── SearchBar.jsx
│           ├── ProfileCard.jsx
│           ├── RoastSection.jsx
│           ├── RepoList.jsx
│           ├── Charts.jsx
│           ├── UnifiedBattle.jsx
│           └── Leaderboard.jsx
├── vite.config.js
└── package.json
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/user/:username` | GitHub profile data |
| GET | `/api/repos/:username` | Repos sorted by stars |
| GET | `/api/stats/:username` | Commit activity and language breakdown |
| GET | `/api/roast/:username` | AI report card and savage roast |
| POST | `/api/battle` | Unified battle — profile, single repo, or multi repo |
| GET | `/api/leaderboard/roasted` | Most roasted devs |
| GET | `/api/leaderboard/battled` | Most battled devs |
| GET | `/api/leaderboard/winrate` | Win rate rankings |
| GET | `/api/leaderboard/starred` | Top starred repo holders |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- GitHub Personal Access Token → [Get one here](https://github.com/settings/tokens)
- Groq API key (free) → [Get one here](https://console.groq.com)

### Installation

1. **Clone the repo**

```bash
git clone https://github.com/YOUR_USERNAME/gitscope-ai.git
cd gitscope-ai
```

2. **Install dependencies**

```bash
npm install
```

3. **Create `server/.env`**

```
GITHUB_TOKEN=your_github_token_here
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

4. **Run in development**

```bash
npm run dev
```

- React app runs at `http://localhost:5173`
- Express server runs at `http://localhost:3000`

5. **Build for production**

```bash
npm run build
npm start
```

---

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Runs server and React client together |
| `npm run dev:server` | Runs Express server only |
| `npm run dev:client` | Runs Vite React app only |
| `npm run build` | Builds React into `/public` |
| `npm start` | Builds and starts production server |

---

## What is New in v2.0

- React frontend with Vite replacing Vanilla JS
- Commit activity heatmap (13 weeks)
- Language breakdown pie chart
- Unified Battle Mode replacing two separate battle sections
- Multi-repo judging styles — combined score, best repo, or ranked
- Charts in battle mode showing both fighters side by side
- Shareable roast card with one-click download
- Hall of Flame leaderboard with 4 live tabs
- Battle stats tracking — wins, losses, battles count, top stars

---

## Changelog

### v2.0.0
- Migrated frontend from Vanilla JS to React + Vite
- Added commit activity heatmap
- Added language breakdown pie chart
- Replaced Battle Mode and Repo Battle with Unified Battle Mode
- Added multi-repo judging (combined score / best repo / ranked)
- Added shareable roast card download
- Added Hall of Flame leaderboard with 4 tabs
- Added battle stats tracking

### v1.0.0
- GitHub profile lookup
- Top 10 repos sorted by stars
- AI report card graded A to F
- Savage AI roast
- Basic battle mode
- Dark UI

---

## Roadmap — v3.0

### UI Overhaul
- [ ] Full design system with consistent spacing and typography
- [ ] Smooth page transitions and loading animations
- [ ] Skeleton loaders replacing plain loading text
- [ ] Mobile-first responsive layout that works on any screen size
- [ ] Light and dark mode toggle

### UX Improvements
- [ ] Recent searches history stored locally
- [ ] Share battle results as a downloadable image card
- [ ] Confetti animation when roast loads
- [ ] Animated heatmap cells on page load
- [ ] Toast notifications replacing inline error messages

### New Features
- [ ] GitHub streak tracker — current streak and longest streak ever
- [ ] Most productive day and hour of the week
- [ ] Repo timeline — visualize when repos were created over the years
- [ ] Dev DNA card — personality type generated from coding patterns (e.g. "The Polyglot", "The One-Language Purist", "The Star Chaser")
- [ ] Comparison radar chart — spider chart comparing two devs across 6 axes (stars, activity, variety, followers, repos, consistency)
- [ ] Trophy case — auto-detect achievements based on stats (e.g. "10k Star Club", "Polyglot", "Open Source Hero", "Ghost Coder")
- [ ] Public profile page — shareable URL for each roasted dev

### Technical
- [ ] Deploy to Railway — live URL anyone can access
- [ ] Rate limiting to prevent GitHub API abuse
- [ ] Caching layer so repeat searches skip the API call
- [ ] Error boundary components in React
- [ ] Environment-based config for dev vs production

---

## Keep Your Keys Safe

Make sure your `.gitignore` contains:

```
server/.env
server/leaderboard.json
server/battles.json
node_modules/
```

---

## Built By

**Sameer** — built across two vibe coding sessions, v1 to v2, completely from scratch.

---

## License

MIT — do whatever you want with it.
