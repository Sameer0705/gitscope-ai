require('dotenv').config({ path: './server/.env' });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`GitScope running at http://localhost:${PORT}`);
});