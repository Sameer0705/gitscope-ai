require('dotenv').config({ path: './server/.env' });
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ── Leaderboard helpers ────────────────────────────────────────────────────────
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');
const BATTLE_FILE = path.join(__dirname, 'battles.json');

function readBattles() {
  try {
    if (!fs.existsSync(BATTLE_FILE)) return [];
    return JSON.parse(fs.readFileSync(BATTLE_FILE, 'utf8'));
  } catch { return []; }
}

function saveBattleResult(winner, loser, winnerRepo, loserRepo, winnerStars, loserStars) {
  const battles = readBattles();

  function upsert(username, repo, stars, won) {
    const existing = battles.find(e => e.username === username);
    if (existing) {
      existing.battles += 1;
      existing.wins   += won ? 1 : 0;
      existing.losses += won ? 0 : 1;
      if (repo && !existing.repos.includes(repo)) existing.repos.push(repo);
      if (stars > existing.topStars) existing.topStars = stars;
    } else {
      battles.push({
        username,
        battles: 1,
        wins:    won ? 1 : 0,
        losses:  won ? 0 : 1,
        repos:   repo ? [repo] : [],
        topStars: stars || 0,
      });
    }
  }

  upsert(winner, winnerRepo, winnerStars, true);
  upsert(loser,  loserRepo,  loserStars,  false);

  fs.writeFileSync(BATTLE_FILE, JSON.stringify(battles, null, 2));
}

function readLeaderboard() {
  try {
    if (!fs.existsSync(LEADERBOARD_FILE)) return [];
    return JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveToLeaderboard(username, avatar, name) {
  const board = readLeaderboard();
  const existing = board.find(e => e.username === username);

  if (existing) {
    existing.roastCount += 1;
    existing.lastRoasted = new Date().toISOString();
  } else {
    board.push({
      username,
      name: name || username,
      avatar,
      roastCount: 1,
      lastRoasted: new Date().toISOString(),
    });
  }

  board.sort((a, b) => b.roastCount - a.roastCount);
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(board, null, 2));
  return board.slice(0, 10);
}

// ── ROUTE: Get GitHub user profile ────────────────────────────────────────────
app.get('/api/user/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'GitHub user not found' });
    }

    const data = await response.json();

    res.json({
      username: data.login,
      name: data.name,
      avatar: data.avatar_url,
      bio: data.bio,
      location: data.location,
      followers: data.followers,
      following: data.following,
      public_repos: data.public_repos,
      joined: data.created_at,
      profile_url: data.html_url,
    });

  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ── ROUTE: Get GitHub user repos ───────────────────────────────────────────────
app.get('/api/repos/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Could not fetch repos' });
    }

    const repos = await response.json();

    // Clean up — only send what we need
    const cleaned = repos.map(repo => ({
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      url: repo.html_url,
      updated: repo.updated_at,
    }));

    // Sort by stars (highest first)
    cleaned.sort((a, b) => b.stars - a.stars);

    res.json(cleaned);

  } catch (err) {
    console.error('Error fetching repos:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ── ROUTE: AI Roast + Report Card ─────────────────────────────────────────────
app.get('/api/roast/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Fetch user + repos together
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }),
    ]);

    const user = await userRes.json();
    const repos = await reposRes.json();

    // Build a summary to send to Gemini
    const topRepos = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map(r => `${r.name} (⭐${r.stargazers_count}, language: ${r.language || 'unknown'})`)
      .join(', ');

    const languages = [...new Set(repos.map(r => r.language).filter(Boolean))];
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

const prompt = `
You are a savage, witty tech roast comedian. Your job is to ROAST this developer hard — like a Comedy Central roast. Be brutal, be funny, make fun of their actual stats. Do NOT just describe their profile. Exaggerate, mock, compare them to embarrassing things. Make it hurt (in a funny way).

GitHub stats for ${user.login}:
- Followers: ${user.followers} | Following: ${user.following}
- Public Repos: ${user.public_repos} | Total Stars: ${totalStars}
- Languages: ${languages.join(', ') || 'none detected'}
- Top repos: ${topRepos || 'tumbleweeds'}
- Account created: ${user.created_at}
- Bio: ${user.bio || 'too cool to write a bio apparently'}

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

📊 REPORT CARD
- Code Variety: [Grade A-F] — [one savage line about their language choices]
- Popularity: [Grade A-F] — [one savage line about their stars/followers]
- Activity: [Grade A-F] — [one savage line about their repo count/updates]  
- Profile Polish: [Grade A-F] — [one savage line about their bio/presentation]
- Overall GPA: [Grade] — [one brutal summary line]

🔥 ROAST
[Write 5-6 lines. Each line should be a standalone joke or burn. Reference their ACTUAL stats — if they have 0 stars, mock that. If they follow more than they have followers, mock that. If they only know one language, mock that. If their repos are all forks, mock that. Be creative and SPECIFIC to this person's data. End with one final knockout line.]
`;

    // Call Groq API
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
      }),
    });

    const groqData = await groqRes.json();
    

    const aiText = groqData.choices?.[0]?.message?.content;

    if (!aiText) {
      return res.status(500).json({ error: 'Groq returned no response' });
    }

    saveToLeaderboard(user.login, user.avatar_url, user.name);
    res.json({ roast: aiText });

  } catch (err) {
    console.error('Roast error:', err);
    res.status(500).json({ error: 'Failed to generate roast' });
  }
});

// ── ROUTE: Compare two GitHub users ───────────────────────────────────────────
app.get('/api/compare/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    // Fetch both users and their repos at the same time
    const [u1Res, u2Res, r1Res, r2Res] = await Promise.all([
      fetch(`https://api.github.com/users/${user1}`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      }),
      fetch(`https://api.github.com/users/${user2}`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      }),
      fetch(`https://api.github.com/users/${user1}/repos?per_page=100`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      }),
      fetch(`https://api.github.com/users/${user2}/repos?per_page=100`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      }),
    ]);

    if (!u1Res.ok) return res.status(404).json({ error: `User ${user1} not found` });
    if (!u2Res.ok) return res.status(404).json({ error: `User ${user2} not found` });

    const [u1, u2, r1, r2] = await Promise.all([
      u1Res.json(), u2Res.json(), r1Res.json(), r2Res.json()
    ]);

    // Calculate stats
    const stats1 = {
      username: u1.login,
      name: u1.name || u1.login,
      avatar: u1.avatar_url,
      followers: u1.followers,
      repos: u1.public_repos,
      stars: r1.reduce((sum, r) => sum + r.stargazers_count, 0),
      languages: [...new Set(r1.map(r => r.language).filter(Boolean))],
      topRepo: r1.sort((a, b) => b.stargazers_count - a.stargazers_count)[0]?.name || 'none',
    };

    const stats2 = {
      username: u2.login,
      name: u2.name || u2.login,
      avatar: u2.avatar_url,
      followers: u2.followers,
      repos: u2.public_repos,
      stars: r2.reduce((sum, r) => sum + r.stargazers_count, 0),
      languages: [...new Set(r2.map(r => r.language).filter(Boolean))],
      topRepo: r2.sort((a, b) => b.stargazers_count - a.stargazers_count)[0]?.name || 'none',
    };

    // Build prompt for Groq
const prompt = `
You are a savage battle commentator judging a developer death match. This is WWE but for GitHub profiles. Be brutal, funny, and SPECIFIC to their actual stats. Pick a clear winner and destroy the loser.

FIGHTER 1: ${stats1.username}
- Stars: ${stats1.stars} | Followers: ${stats1.followers} | Repos: ${stats1.repos}
- Languages: ${stats1.languages.join(', ') || 'unknown'}
- Top Repo: ${stats1.topRepo}

FIGHTER 2: ${stats2.username}  
- Stars: ${stats2.stars} | Followers: ${stats2.followers} | Repos: ${stats2.repos}
- Languages: ${stats2.languages.join(', ') || 'unknown'}
- Top Repo: ${stats2.topRepo}

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

⚔️ BATTLE BREAKDOWN
- Stars: [who wins] — [savage one-liner comparing their star counts]
- Followers: [who wins] — [savage one-liner]
- Repo Count: [who wins] — [savage one-liner]  
- Language Variety: [who wins] — [savage one-liner]

🏆 FINAL VERDICT
[3-4 lines declaring the winner. Be theatrical and savage. Mock the loser specifically. Use their actual numbers to make it sting. End with a knockout final line that buries the loser.]
`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
      }),
    });

    const groqData = await groqRes.json();
    const verdict = groqData.choices?.[0]?.message?.content;

    if (!verdict) return res.status(500).json({ error: 'AI returned no response' });

    res.json({ stats1, stats2, verdict });

  } catch (err) {
    console.error('Compare error:', err);
    res.status(500).json({ error: 'Comparison failed' });
  }
});

// ── ROUTE: Unified Battle ──────────────────────────────────────────────────────
app.post('/api/battle', async (req, res) => {
  const { user1, user2, mode, repos1, repos2, multiMode } = req.body;

  try {
    // Always fetch both profiles
    const [u1Res, u2Res] = await Promise.all([
      fetch(`https://api.github.com/users/${user1}`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      }),
      fetch(`https://api.github.com/users/${user2}`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      }),
    ]);

    if (!u1Res.ok) return res.status(404).json({ error: `User "${user1}" not found` });
    if (!u2Res.ok) return res.status(404).json({ error: `User "${user2}" not found` });

    const [u1, u2] = await Promise.all([u1Res.json(), u2Res.json()]);

    // Fetch all repos for both users
    const [r1Res, r2Res] = await Promise.all([
      fetch(`https://api.github.com/users/${user1}/repos?per_page=100`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      }),
      fetch(`https://api.github.com/users/${user2}/repos?per_page=100`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      }),
    ]);

    const [allRepos1, allRepos2] = await Promise.all([r1Res.json(), r2Res.json()]);

    const [e1Res, e2Res] = await Promise.all([
      fetch('https://api.github.com/users/' + user1 + '/events?per_page=100', {
        headers: { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN },
      }),
      fetch('https://api.github.com/users/' + user2 + '/events?per_page=100', {
        headers: { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN },
      }),
    ]);

    const [events1, events2] = await Promise.all([e1Res.json(), e2Res.json()]);

    function buildStats(events, repos) {
      const commitMap = {}
      events
        .filter(function(e) { return e.type === 'PushEvent' })
        .forEach(function(e) {
          const day = e.created_at.split('T')[0]
          commitMap[day] = (commitMap[day] || 0) + (e.payload.commits ? e.payload.commits.length : 1)
        })

      const commitActivity = Object.entries(commitMap).map(function(entry) {
        return { date: entry[0], count: entry[1] }
      })

      const langMap = {}
      repos.forEach(function(r) {
        if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1
      })

      const languages = Object.entries(langMap)
        .map(function(entry) { return { name: entry[0], count: entry[1] } })
        .sort(function(a, b) { return b.count - a.count })
        .slice(0, 8)

      return { commitActivity, languages }
    }

    const stats1 = buildStats(events1, allRepos1)
    const stats2 = buildStats(events2, allRepos2)

    // Build profile summaries
    const profile1 = {
      username: u1.login, name: u1.name || u1.login,
      avatar: u1.avatar_url, followers: u1.followers,
      following: u1.following, public_repos: u1.public_repos,
      totalStars: allRepos1.reduce((s, r) => s + r.stargazers_count, 0),
      languages: [...new Set(allRepos1.map(r => r.language).filter(Boolean))],
    };

    const profile2 = {
      username: u2.login, name: u2.name || u2.login,
      avatar: u2.avatar_url, followers: u2.followers,
      following: u2.following, public_repos: u2.public_repos,
      totalStars: allRepos2.reduce((s, r) => s + r.stargazers_count, 0),
      languages: [...new Set(allRepos2.map(r => r.language).filter(Boolean))],
    };

    // Build repo context depending on mode
    let repoContext = '';

    if (mode === 'single') {
      // Fetch full details for each chosen repo
      const [rd1Res, rd2Res] = await Promise.all([
        fetch(`https://api.github.com/repos/${user1}/${repos1[0]}`, {
          headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
        }),
        fetch(`https://api.github.com/repos/${user2}/${repos2[0]}`, {
          headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
        }),
      ]);
      const [rd1, rd2] = await Promise.all([rd1Res.json(), rd2Res.json()]);

      repoContext = `
REPO BATTLE (single repo each):
${user1}'s repo "${rd1.name}": ⭐${rd1.stargazers_count} stars, 🍴${rd1.forks_count} forks, ${rd1.open_issues_count} open issues, ${rd1.size}kb, language: ${rd1.language || 'unknown'}, last updated: ${rd1.updated_at}
Description: ${rd1.description || 'none'}

${user2}'s repo "${rd2.name}": ⭐${rd2.stargazers_count} stars, 🍴${rd2.forks_count} forks, ${rd2.open_issues_count} open issues, ${rd2.size}kb, language: ${rd2.language || 'unknown'}, last updated: ${rd2.updated_at}
Description: ${rd2.description || 'none'}
`;
    } else if (mode === 'multi') {
      const buildMultiStats = (repoNames, allRepos, judgingMode) => {
        const selected = allRepos.filter(r => repoNames.includes(r.name));
        if (judgingMode === 'combined') {
          return {
            repos: repoNames.join(', '),
            totalStars: selected.reduce((s, r) => s + r.stargazers_count, 0),
            totalForks: selected.reduce((s, r) => s + r.forks_count, 0),
            languages: [...new Set(selected.map(r => r.language).filter(Boolean))].join(', '),
            count: selected.length,
          };
        } else if (judgingMode === 'best') {
          const best = selected.sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
          return { repos: repoNames.join(', '), best: best?.name, bestStars: best?.stargazers_count };
        } else {
          // ranked
          return {
            repos: selected
              .map((r, i) => `#${i + 1} ${r.name} (⭐${r.stargazers_count})`)
              .join(', '),
          };
        }
      };

      const ms1 = buildMultiStats(repos1, allRepos1, multiMode);
      const ms2 = buildMultiStats(repos2, allRepos2, multiMode);

      repoContext = `
REPO BATTLE (multiple repos, judging style: ${multiMode}):
${user1}'s selected repos: ${JSON.stringify(ms1)}
${user2}'s selected repos: ${JSON.stringify(ms2)}
`;
    } else {
      // whole profile — no extra repo fetching needed
      repoContext = `
WHOLE PROFILE BATTLE (no specific repos — judge everything):
${user1}: ${profile1.public_repos} total repos, ${profile1.totalStars} total stars, languages: ${profile1.languages.join(', ')}
${user2}: ${profile2.public_repos} total repos, ${profile2.totalStars} total stars, languages: ${profile2.languages.join(', ')}
`;
    }

    const prompt = `
You are a savage, theatrical battle judge — like a WWE commentator crossed with a tech critic. Be BRUTAL, FUNNY, and SPECIFIC. Use their real numbers. Pick one clear winner and destroy the loser.

FIGHTER 1: ${profile1.username}
- Followers: ${profile1.followers} | Following: ${profile1.following}
- Public Repos: ${profile1.public_repos} | Total Stars: ${profile1.totalStars}
- Languages: ${profile1.languages.join(', ') || 'none'}

FIGHTER 2: ${profile2.username}
- Followers: ${profile2.followers} | Following: ${profile2.following}
- Public Repos: ${profile2.public_repos} | Total Stars: ${profile2.totalStars}
- Languages: ${profile2.languages.join(', ') || 'none'}

${repoContext}

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

⚔️ BATTLE BREAKDOWN
- Popularity: [winner] — [savage one-liner using real follower/star numbers]
- Code Arsenal: [winner] — [savage one-liner about language variety]
- Repo Game: [winner] — [savage one-liner about repo count and quality]
${mode !== 'whole' ? '• Repo Choice: [winner] — [savage one-liner about their specific repo picks]' : ''}

🔥 PRE-FIGHT TRASH TALK
[2 lines of trash talk FROM each fighter TO the other. Make it personal to their stats. Format: username1: "..." then username2: "..."]

🏆 FINAL VERDICT
[4-5 lines. Declare the winner dramatically. Destroy the loser with specific stat references. End with one knockout line that buries the loser for good.]
`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.2,
      }),
    });

    const groqData = await groqRes.json();
    const verdict = groqData.choices?.[0]?.message?.content;
    if (!verdict) return res.status(500).json({ error: 'AI returned no response' });

    // Track battle stats — first fighter is treated as winner for tracking purposes
    // The AI verdict decides real winner but we track participation either way
    const winnerUsername = profile1.username;
    const loserUsername  = profile2.username;
    const winnerRepo = mode === 'single' ? repos1[0] : null;
    const loserRepo  = mode === 'single' ? repos2[0] : null;
    saveBattleResult(
      winnerUsername, loserUsername,
      winnerRepo, loserRepo,
      profile1.totalStars, profile2.totalStars
    );
    res.json({ profile1, profile2, verdict, mode, stats1, stats2 });

  } catch (err) {
    console.error('Battle error:', err);
    res.status(500).json({ error: 'Battle failed' });
  }
});

// ── ROUTE: Get leaderboard ─────────────────────────────────────────────────────
app.get('/api/leaderboard', (req, res) => {
  const board = readLeaderboard();
  res.json(board.slice(0, 10));
});

// ── ROUTE: Clear leaderboard (dev only) ───────────────────────────────────────
app.delete('/api/leaderboard', (req, res) => {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([], null, 2));
  res.json({ message: 'Leaderboard cleared' });
});

// ── ROUTE: Most roasted leaderboard ───────────────────────────────────────────
app.get('/api/leaderboard/roasted', (req, res) => {
  const board = readLeaderboard();
  res.json(board.slice(0, 10));
});

// ── ROUTE: Most battled leaderboard ───────────────────────────────────────────
app.get('/api/leaderboard/battled', (req, res) => {
  const battles = readBattles();
  const sorted = [...battles]
    .sort((a, b) => b.battles - a.battles)
    .slice(0, 10);
  res.json(sorted);
});

// ── ROUTE: Win rate leaderboard ───────────────────────────────────────────────
app.get('/api/leaderboard/winrate', (req, res) => {
  const battles = readBattles();
  const qualified = battles
    .filter(e => e.battles >= 2)
    .map(e => ({
      ...e,
      winRate: Math.round((e.wins / e.battles) * 100),
    }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 10);
  res.json(qualified);
});

// ── ROUTE: Most starred repo leaderboard ──────────────────────────────────────
app.get('/api/leaderboard/starred', (req, res) => {
  const battles = readBattles();
  const sorted = [...battles]
    .sort((a, b) => b.topStars - a.topStars)
    .slice(0, 10);
  res.json(sorted);
});

// ── ROUTE: Get commit activity + language stats ────────────────────────────────
app.get('/api/stats/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const [eventsRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}/events?per_page=100`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      }),
    ]);

    const [events, repos] = await Promise.all([eventsRes.json(), reposRes.json()]);

    // Commit activity — count pushes per day
    const commitMap = {};
    events
      .filter(e => e.type === 'PushEvent')
      .forEach(e => {
        const day = e.created_at.split('T')[0];
        commitMap[day] = (commitMap[day] || 0) + (e.payload.commits?.length || 1);
      });

    const commitActivity = Object.entries(commitMap).map(([date, count]) => ({
      date,
      count,
    }));

    // Language breakdown
    const langMap = {};
    repos.forEach(repo => {
      if (repo.language) {
        langMap[repo.language] = (langMap[repo.language] || 0) + 1;
      }
    });

    const languages = Object.entries(langMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json({ commitActivity, languages });

  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`GitScope running at http://localhost:${PORT}`);
});