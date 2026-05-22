/* ════════════════════════════════════════
   MAIN.JS
   ════════════════════════════════════════ */

/* ── STATUSBAR line counter ── */
const sbLine = document.getElementById('sb-line');
if (sbLine) {
  window.addEventListener('scroll', () => {
    const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    sbLine.textContent = 'ln ' + Math.round(progress * 400) + ', col 1';
  });
}

/* ── SCROLL-IN animation ── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.07 });

document.querySelectorAll('.explore-card').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(10px)';
  el.style.transition = `opacity 0.4s ${i * 0.08}s ease, transform 0.4s ${i * 0.08}s ease`;
  observer.observe(el);
});

/* ── Discord Presence (Lanyard) ── */
// SETUP: Join https://discord.gg/lanyard so your presence is tracked
const DISCORD_USER_ID = '587056027464105994';
const FETCH_TIMEOUT = 5000;

const DC = {
  profile: {
    banner: document.getElementById('dp-banner'),
    avatar: document.getElementById('dp-avatar'),
    decoration: document.getElementById('dp-decoration'),
    name: document.getElementById('dp-name'),
    username: document.getElementById('dp-username'),
    clan: document.getElementById('dp-clan'),
    statusLabel: document.getElementById('dp-status-label'),
    statusDot: document.getElementById('dp-status-dot-big'),
    badges: document.getElementById('dp-badges'),
  },
};

if (DC.profile.name) {
  fetchProfile();
  fetchPresence();
  setInterval(fetchPresence, 30000);
}

async function fetchProfile() {
  try {
    const res = await fetch('/api/discord-profile');
    if (!res.ok || !DC.profile.banner) return;
    const data = await res.json();
    if (data.banner) {
      const ext = data.banner.startsWith('a_') ? 'gif' : 'png';
      const url = `url(https://cdn.discordapp.com/banners/${DISCORD_USER_ID}/${data.banner}.${ext}?size=480)`;
      DC.profile.banner.style.backgroundImage = url;
    } else if (data.accent_color) {
      const clr = `#${data.accent_color.toString(16).padStart(6, '0')}`;
      DC.profile.banner.style.background = clr;
    }
  } catch { /* Vercel API not available */ }
}

async function fetchPresence() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`, { signal: ctrl.signal });
    const body = await res.json();
    if (!body.success) throw Error('bad response');
    updateProfileCard(body.data);
  } catch {
    /* Lanyard not available — profile stays in loading state */
  } finally {
    clearTimeout(timer);
  }
}

function updateProfileCard(data) {
  const p = DC.profile;
  if (!p.name) return; // profile card not on this page

  const u = data.discord_user;

  // Avatar
  if (u.avatar && p.avatar) {
    const h = u.avatar;
    p.avatar.src = `https://cdn.discordapp.com/avatars/${u.id}/${h}.${h.startsWith('a_') ? 'gif' : 'png'}?size=128`;
    p.avatar.alt = `${u.global_name || u.username}'s avatar`;
  }

  // Avatar decoration overlay
  if (u.avatar_decoration_data?.asset && p.decoration) {
    p.decoration.src = `https://cdn.discordapp.com/avatar-decoration-presets/${u.avatar_decoration_data.asset}.png`;
    p.decoration.alt = 'Avatar decoration';
  }

  // Name + username
  if (p.name) p.name.textContent = u.global_name || u.username;
  if (p.username) p.username.textContent = `@${u.username}`;

  // Clan tag + badge
  if (p.clan && u.clan) {
    let html = '';
    if (u.clan.badge && u.clan.guild_id) {
      html += `<img src="https://cdn.discordapp.com/clan-badges/${u.clan.guild_id}/${u.clan.badge}.png" alt="" loading="lazy"> `;
    }
    html += u.clan.tag;
    p.clan.innerHTML = html;
    p.clan.style.display = 'inline-flex';
  } else if (p.clan) {
    p.clan.style.display = 'none';
  }

  // Status
  const statuses = {
    online:  { color: '#57F287', label: 'Online' },
    idle:    { color: '#FEE75C', label: 'Idle' },
    dnd:     { color: '#ED4245', label: 'Do Not Disturb' },
    offline: { color: '#80848e', label: 'Offline' },
  };
  const st = statuses[data.discord_status] || statuses.offline;
  if (p.statusDot) p.statusDot.style.background = st.color;
  if (p.statusLabel) p.statusLabel.textContent = st.label;

  // Badges from public_flags bitfield
  if (p.badges && u.public_flags) {
    const BADGES = [
      [1 << 0,  '5e974d4fb63c544a6da331f0c24d4675', 'Staff'],
      [1 << 1,  '482554b6eb9ca1f56d2a4484c26fc357', 'Partner'],
      [1 << 2,  '3294980ad6f921d0995910023a522289', 'HypeSquad'],
      [1 << 3,  '5131be9754a6f33d6fc15e9cd673711c', 'Bug Hunter L1'],
      [1 << 6,  'acc2d071759f1ea69c28552d4b0bb0c7', 'Bravery'],
      [1 << 7,  '57afa3b4a05ef85db7943ff12954f044', 'Brilliance'],
      [1 << 8,  '010d52b4422d9061ca75e4ba2a80b98f', 'Balance'],
      [1 << 9,  '7e531cfb3fc5f4c2534a5b26c5ac8192', 'Early Supporter'],
      [1 << 14, 'a79e0e13b8ff3e8f29daffa10d255156', 'Bug Hunter L2'],
      [1 << 17, 'a2b790c19cb4e6c3e41f30cc13722c62', 'Developer'],
      [1 << 18, 'e3bd8f5624f2be1b8ec63f88fe2826e1', 'Moderator'],
      [1 << 22, '2f193c7b149b7c7b4ac6cb2062e0466c', 'Active Dev'],
    ];
    p.badges.innerHTML = '';
    BADGES.forEach(([flag, hash, name]) => {
      if (u.public_flags & flag) {
        const img = document.createElement('img');
        img.src = `https://cdn.discordapp.com/badge-icons/${hash}.png`;
        img.alt = name;
        img.title = name;
        img.loading = 'lazy';
        p.badges.appendChild(img);
      }
    });
  }

  // Activity / Now Playing
  const actEl = document.getElementById('dp-activity');
  if (!actEl) return;

  const activities = data.activities || [];
  const game = activities.find(a => a.type === 0); // type 0 = Game

  if (game) {
    const lines = [game.name];
    if (game.state)   lines.push(game.state);
    if (game.details) lines.push(game.details);
    actEl.innerHTML = `<span class="dp-activity-name">> ${lines.join(' | ')}</span>`;
    actEl.className = 'dp-activity visible';
  }
}

document.getElementById('easter-egg')?.addEventListener('click', function () {
  const overlay = document.getElementById('egg-overlay');
  if (!overlay) return;
  overlay.classList.toggle('hidden');
});
