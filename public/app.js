const searchBtn = document.getElementById('search-btn');
const usernameInput = document.getElementById('username-input');
const errorMsg = document.getElementById('error-msg');
const profileCard = document.getElementById('profile-card');
const reposSection = document.getElementById('repos-section');
const roastBtnWrapper = document.getElementById('roast-btn-wrapper');
const roastBtn = document.getElementById('roast-btn');
const roastSection = document.getElementById('roast-section');
const roastOutput = document.getElementById('roast-output');

// Search on button click or Enter key
searchBtn.addEventListener('click', startSearch);
usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startSearch();
});

async function startSearch() {
  const username = usernameInput.value.trim();
  if (!username) return;

  // Reset UI
  hideElement(profileCard);
  hideElement(reposSection);
  showError('');
  searchBtn.textContent = 'Loading...';
  searchBtn.disabled = true;

  try {
    // Fetch profile and repos at the same time
    const [userRes, reposRes] = await Promise.all([
      fetch(`/api/user/${username}`),
      fetch(`/api/repos/${username}`)
    ]);

    if (!userRes.ok) throw new Error('User not found');

    const user = await userRes.json();
    const repos = await reposRes.json();

    renderProfile(user);
    renderRepos(repos);
    showElement(roastBtnWrapper);
    hideElement(roastSection);
  } catch (err) {
    showError('User not found. Check the username and try again.');
  } finally {
    searchBtn.textContent = 'Analyze';
    searchBtn.disabled = false;
  }
}

function renderProfile(user) {
  document.getElementById('avatar').src = user.avatar;
  document.getElementById('profile-name').textContent = user.name || user.username;
  document.getElementById('profile-username').textContent = `@${user.username}`;
  document.getElementById('profile-bio').textContent = user.bio || '';
  document.getElementById('profile-location').textContent = user.location ? `📍 ${user.location}` : '';
  document.getElementById('stat-followers').textContent = `👥 ${user.followers} followers`;
  document.getElementById('stat-following').textContent = `➡️ ${user.following} following`;
  document.getElementById('stat-repos').textContent = `📦 ${user.public_repos} repos`;

  showElement(profileCard);
}

function renderRepos(repos) {
  const list = document.getElementById('repos-list');
  list.innerHTML = '';

  // Show top 10 only
  repos.slice(0, 10).forEach(repo => {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.innerHTML = `
      <a href="${repo.url}" target="_blank">${repo.name}</a>
      <p>${repo.description || 'No description'}</p>
      <div class="repo-meta">
        <span>⭐ ${repo.stars}</span>
        <span>🍴 ${repo.forks}</span>
        ${repo.language ? `<span>🔵 ${repo.language}</span>` : ''}
      </div>
    `;
    list.appendChild(card);
  });

  showElement(reposSection);
}

function showError(msg) {
  errorMsg.textContent = msg;
  msg ? showElement(errorMsg) : hideElement(errorMsg);
}

function showElement(el) { el.classList.remove('hidden'); }
function hideElement(el) { el.classList.add('hidden'); }

// ── AI Roast ──────────────────────────────────────────────────────────────────
roastBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  if (!username) return;

  roastBtn.textContent = '🔥 Roasting...';
  roastBtn.disabled = true;
  hideElement(roastSection);

  try {
    const res = await fetch(`/api/roast/${username}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    roastOutput.textContent = data.roast;
    showElement(roastSection);

  } catch (err) {
    roastOutput.textContent = 'Failed to generate roast. Try again.';
    showElement(roastSection);
  } finally {
    roastBtn.textContent = '🔥 Roast Me';
    roastBtn.disabled = false;
  }
});

// ── Comparison Mode ───────────────────────────────────────────────────────────
const compareBtn = document.getElementById('compare-btn');
const compareError = document.getElementById('compare-error');
const compareCards = document.getElementById('compare-cards');
const verdictSection = document.getElementById('verdict-section');
const verdictOutput = document.getElementById('verdict-output');

compareBtn.addEventListener('click', async () => {
  const user1 = document.getElementById('compare-user1').value.trim();
  const user2 = document.getElementById('compare-user2').value.trim();

  if (!user1 || !user2) {
    compareError.textContent = 'Please enter both usernames.';
    showElement(compareError);
    return;
  }

  hideElement(compareCards);
  hideElement(verdictSection);
  hideElement(compareError);
  compareBtn.textContent = '⚔️ Battling...';
  compareBtn.disabled = true;

  try {
    const res = await fetch(`/api/compare/${user1}/${user2}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    // Fill card 1
    document.getElementById('c-avatar1').src = data.stats1.avatar;
    document.getElementById('c-name1').textContent = data.stats1.name;
    document.getElementById('c-username1').textContent = `@${data.stats1.username}`;
    document.getElementById('c-stars1').textContent = `⭐ ${data.stats1.stars} stars`;
    document.getElementById('c-followers1').textContent = `👥 ${data.stats1.followers} followers`;
    document.getElementById('c-repos1').textContent = `📦 ${data.stats1.repos} repos`;

    // Fill card 2
    document.getElementById('c-avatar2').src = data.stats2.avatar;
    document.getElementById('c-name2').textContent = data.stats2.name;
    document.getElementById('c-username2').textContent = `@${data.stats2.username}`;
    document.getElementById('c-stars2').textContent = `⭐ ${data.stats2.stars} stars`;
    document.getElementById('c-followers2').textContent = `👥 ${data.stats2.followers} followers`;
    document.getElementById('c-repos2').textContent = `📦 ${data.stats2.repos} repos`;

    verdictOutput.textContent = data.verdict;

    showElement(compareCards);
    showElement(verdictSection);

  } catch (err) {
    compareError.textContent = err.message || 'Battle failed. Check both usernames.';
    showElement(compareError);
  } finally {
    compareBtn.textContent = '⚔️ Battle';
    compareBtn.disabled = false;
  }
});