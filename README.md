# 🔭 GitScope AI

> Analyze any GitHub profile — AI-powered report cards, savage roasts, and dev battle mode.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-v18+-green)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## What is GitScope AI?

GitScope AI is a web app that takes any public GitHub username and gives you:

- 📊 **AI Report Card** — grades the developer on code variety, popularity, activity, and profile polish
- 🔥 **Savage Roast** — a Comedy Central-style roast based on their actual GitHub stats
- ⚔️ **Battle Mode** — drop two GitHub usernames and get an AI verdict on who's the better dev

Built with Node.js, Express, the GitHub REST API, and Groq AI (LLaMA 3).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Frontend | Vanilla JS + HTML + CSS |
| GitHub Data | GitHub REST API |
| AI | Groq API (llama-3.1-8b-instant) |
| Environment | dotenv |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A GitHub Personal Access Token → [Get one here](https://github.com/settings/tokens)
- A Groq API key (free) → [Get one here](https://console.groq.com)

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

3. **Set up your environment variables**

Create a file at `server/.env`:

```
GITHUB_TOKEN=your_github_token_here
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

4. **Run the server**

```bash
node server/server.js
```

5. **Open in your browser**

```
http://localhost:3000
```

---

## Project Structure

```
gitscope-ai/
├── server/
│   ├── server.js        # Express server + all API routes
│   └── .env             # Your secret keys (never commit this!)
├── public/
│   ├── index.html       # Main UI
│   ├── style.css        # Styling
│   └── app.js           # Frontend logic
└── package.json
```

---

## API Routes

| Route | Description |
|-------|-------------|
| `GET /api/user/:username` | Fetches GitHub profile data |
| `GET /api/repos/:username` | Fetches and sorts repos by stars |
| `GET /api/roast/:username` | Generates AI report card + roast |
| `GET /api/compare/:user1/:user2` | Runs an AI battle between two devs |

---

## Features in v1.0

- [x] GitHub profile lookup
- [x] Top 10 repos sorted by stars
- [x] AI-generated developer report card (graded A–F)
- [x] Savage AI roast based on real stats
- [x] Battle mode — compare two GitHub profiles
- [x] AI verdict with winner declaration
- [x] Clean dark UI

---

## Roadmap — v2.0 Ideas

- [ ] Shareable roast cards (image export)
- [ ] Commit activity heatmap visualization
- [ ] Language breakdown pie chart
- [ ] Most active time of day stat
- [ ] Leaderboard of most roasted profiles
- [ ] Twitter/X share button
- [ ] Deploy to Vercel / Railway

---

## Important — Keep Your Keys Safe

Never commit your `.env` file. The `.gitignore` below will protect you — make sure it exists in your root folder before pushing:

```
# .gitignore
server/.env
node_modules/
```

---

## Built By

**Sameer** — built from scratch in a single vibe coding session.

---

## License

MIT — do whatever you want with it.
