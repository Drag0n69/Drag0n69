import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "assets", "generated");
const configPath = path.join(root, "profile.config.json");
const statsPath = path.join(root, "data", "public-stats.json");

const config = JSON.parse(await readFile(configPath, "utf8"));
let stats = JSON.parse(await readFile(statsPath, "utf8"));

if (process.argv.includes("--refresh-stats")) {
  stats = await fetchPublicStats(config.username);
  await writeFile(statsPath, `${JSON.stringify(stats, null, 2)}\n`, "utf8");
}

const themes = {
  dark: {
    background: "#070b14",
    backgroundEnd: "#101a2a",
    panel: "#0d1624",
    panelBorder: "#24344d",
    text: "#f0f6fc",
    muted: "#8b9bb4",
    accent: "#20d69f",
    accentTwo: "#49b9ff",
    accentThree: "#a879ff",
    grid: "#16243a"
  },
  light: {
    background: "#f6f8fa",
    backgroundEnd: "#eaf2f1",
    panel: "#ffffff",
    panelBorder: "#cbd8d5",
    text: "#17202d",
    muted: "#536272",
    accent: "#087f62",
    accentTwo: "#0969da",
    accentThree: "#8250df",
    grid: "#dce7e4"
  }
};

await mkdir(outputDirectory, { recursive: true });

for (const [name, theme] of Object.entries(themes)) {
  await writeSvg(`banner-${name}.svg`, renderBanner(theme));
  await writeSvg(`stack-${name}.svg`, renderStack(theme));
  await writeSvg(`metrics-${name}.svg`, renderMetrics(theme));
  await writeSvg(`support-${name}.svg`, renderSupport(theme));
  await writeSvg(`footer-${name}.svg`, renderFooter(theme));
}

console.log(`Generated 10 SVG assets in ${path.relative(root, outputDirectory)}`);

async function fetchPublicStats(username) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": `${username}-profile-generator`,
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const encodedUsername = encodeURIComponent(username);
  const [user, repositories, pullRequests, issues] = await Promise.all([
    fetchJson(`https://api.github.com/users/${encodedUsername}`, headers),
    fetchJson(`https://api.github.com/users/${encodedUsername}/repos?per_page=100&type=public`, headers),
    fetchJson(`https://api.github.com/search/issues?q=${encodeURIComponent(`author:${username} type:pr`)}`, headers),
    fetchJson(`https://api.github.com/search/issues?q=${encodeURIComponent(`author:${username} type:issue`)}`, headers)
  ]);
  const originalRepositories = repositories.filter((repository) => !repository.fork);

  return {
    publicRepos: user.public_repos,
    originalPublicRepos: originalRepositories.length,
    starsEarned: originalRepositories.reduce((total, repository) => total + repository.stargazers_count, 0),
    publicPullRequests: pullRequests.total_count,
    publicIssues: issues.total_count,
    followers: user.followers,
    memberSince: new Date(user.created_at).getUTCFullYear(),
    updatedAt: new Date().toISOString()
  };
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${url}: ${await response.text()}`);
  }
  return response.json();
}

async function writeSvg(fileName, content) {
  const normalized = content
    .trim()
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
  await writeFile(path.join(outputDirectory, fileName), `${normalized}\n`, "utf8");
}

function renderBanner(theme) {
  const strands = [
    "M705 80 C790 28 842 54 910 106 S1038 174 1190 92",
    "M680 178 C770 130 824 154 882 214 S1034 310 1195 224",
    "M746 302 C812 236 882 264 926 224 S1050 120 1192 152",
    "M858 34 C886 104 956 108 1006 74 S1102 26 1194 48",
    "M818 346 C842 292 920 302 976 272 S1080 242 1194 316"
  ];

  const paths = strands
    .map((d, index) => `<path class="strand s${index + 1}" d="${d}"/>`)
    .join("\n      ");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 360" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(config.name)} — ${escapeXml(config.identity)}</title>
  <desc id="description">Un réseau Mycelium bioluminescent et animé représentant des systèmes IA local-first sous contrôle humain.</desc>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.background}"/>
      <stop offset="1" stop-color="${theme.backgroundEnd}"/>
    </linearGradient>
    <linearGradient id="signal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${theme.accent}"/>
      <stop offset="0.55" stop-color="${theme.accentTwo}"/>
      <stop offset="1" stop-color="${theme.accentThree}"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="${theme.grid}" stroke-width="1"/>
    </pattern>
    <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <style>
    .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
    .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
    .strand { fill: none; stroke: url(#signal); stroke-width: 2; stroke-linecap: round; opacity: .54; stroke-dasharray: 9 11; animation: flow 18s linear infinite; }
    .s2 { animation-duration: 24s; animation-direction: reverse; opacity: .42; }
    .s3 { animation-duration: 21s; }
    .s4 { animation-duration: 27s; animation-direction: reverse; opacity: .36; }
    .s5 { animation-duration: 23s; opacity: .4; }
    .node { transform-box: fill-box; transform-origin: center; animation: pulse 4.8s ease-in-out infinite; }
    .node:nth-of-type(2n) { animation-delay: -2.3s; }
    .cursor { animation: blink 1.2s steps(2, start) infinite; }
    @keyframes flow { to { stroke-dashoffset: -200; } }
    @keyframes pulse { 0%, 100% { opacity: .5; transform: scale(.82); } 50% { opacity: 1; transform: scale(1.12); } }
    @keyframes blink { 50% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .strand, .node, .cursor { animation: none; } }
  </style>
  <rect width="1200" height="360" rx="24" fill="url(#background)"/>
  <rect width="1200" height="360" rx="24" fill="url(#grid)" opacity=".72"/>
  <circle cx="1040" cy="170" r="250" fill="url(#glow)"/>
  <path d="M42 40H246" stroke="url(#signal)" stroke-width="3" stroke-linecap="round"/>
  <circle cx="42" cy="40" r="5" fill="${theme.accent}" filter="url(#soft-glow)"/>
  <text x="72" y="93" class="mono" fill="${theme.accent}" font-size="16" font-weight="700" letter-spacing="3">${escapeXml(config.username.toUpperCase())} // ${escapeXml(config.identity)}</text>
  <text x="68" y="169" class="sans" fill="${theme.text}" font-size="54" font-weight="750" letter-spacing="-1.2">${escapeXml(config.name.toUpperCase())}</text>
  <text x="72" y="214" class="mono" fill="${theme.muted}" font-size="17" letter-spacing="1.6">${escapeXml(config.headline)}</text>
  <g transform="translate(72 258)">
    <rect width="610" height="50" rx="25" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
    <circle cx="25" cy="25" r="6" fill="${theme.accent}" filter="url(#soft-glow)"/>
    <text x="44" y="31" class="mono" fill="${theme.text}" font-size="12.5" font-weight="650" letter-spacing=".55">${escapeXml(config.statement)}</text>
    <rect class="cursor" x="579" y="17" width="8" height="16" rx="1" fill="${theme.accentTwo}"/>
  </g>
  <g>${paths}</g>
  <g filter="url(#soft-glow)">
    ${networkNode(825, 60, 6, theme.accent)}
    ${networkNode(910, 106, 8, theme.accentTwo)}
    ${networkNode(1006, 74, 5, theme.accentThree)}
    ${networkNode(882, 214, 7, theme.accent)}
    ${networkNode(976, 272, 6, theme.accentTwo)}
    ${networkNode(1080, 242, 5, theme.accentThree)}
    ${networkNode(1134, 112, 8, theme.accent)}
  </g>
  <g class="mono" font-size="11" fill="${theme.muted}" letter-spacing="1">
    <text x="928" y="101">AGENTS</text>
    <text x="899" y="237">CONNAISSANCE</text>
    <text x="1022" y="294">HOMELAB</text>
    <text x="1064" y="267">VALIDATION HUMAINE</text>
  </g>
  <rect x="1" y="1" width="1198" height="358" rx="23" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function renderStack(theme) {
  const badgeWidth = 200;
  const badgeHeight = 48;
  const gap = 20;
  const startX = 60;
  const rows = config.stack.map((item, index) => {
    const column = index % 5;
    const row = Math.floor(index / 5);
    const x = startX + column * (badgeWidth + gap);
    const y = 86 + row * 66;
    const dotStroke = item.label === "Bun" && theme.background === "#f6f8fa" ? theme.muted : item.color;
    return `
      <g transform="translate(${x} ${y})">
        <rect width="${badgeWidth}" height="${badgeHeight}" rx="14" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
        <circle cx="25" cy="24" r="8" fill="${escapeXml(item.color)}" stroke="${dotStroke}"/>
        <text x="44" y="30" class="mono" fill="${theme.text}" font-size="15" font-weight="650">${escapeXml(item.label)}</text>
      </g>`;
  }).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 230" role="img" aria-labelledby="title description">
  <title id="title">Boîte à outils technique de Jordan</title>
  <desc id="description">Dix badges générés pour les langages, environnements, infrastructures et plateformes utilisés par Jordan.</desc>
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${theme.accent}"/><stop offset=".55" stop-color="${theme.accentTwo}"/><stop offset="1" stop-color="${theme.accentThree}"/></linearGradient>
  </defs>
  <style>.mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }</style>
  <rect width="1200" height="230" rx="22" fill="${theme.background}"/>
  <text x="60" y="48" class="mono" fill="${theme.accent}" font-size="14" font-weight="700" letter-spacing="3">BOÎTE À OUTILS // COUCHE DE CONSTRUCTION</text>
  <path d="M904 43H1140" stroke="url(#accent)" stroke-width="2" stroke-linecap="round"/>
  ${rows}
  <rect x="1" y="1" width="1198" height="228" rx="21" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function renderMetrics(theme) {
  const values = [
    { value: stats.publicRepos, label: "DÉPÔTS PUBLICS", color: theme.accent, icon: "repo" },
    { value: stats.originalPublicRepos, label: "PROJETS ORIGINAUX PUBLICS", color: theme.accentTwo, icon: "project" },
    { value: stats.starsEarned, label: "ÉTOILES REÇUES", color: theme.accentThree, icon: "star" },
    { value: stats.publicPullRequests, label: "PULL REQUESTS PUBLIQUES", color: theme.accent, icon: "pull" },
    { value: stats.followers, label: "ABONNÉS GITHUB", color: theme.accentTwo, icon: "users" }
  ];
  const rows = values.map((item, index) => {
    const y = 112 + index * 42;
    return `
      <g transform="translate(82 ${y})">
        <use href="#icon-${item.icon}" x="0" y="-13" width="20" height="20" fill="none" stroke="${item.color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="36" y="2" class="mono" fill="${theme.muted}" font-size="13" font-weight="650" letter-spacing="1">${item.label}</text>
        <text x="620" y="2" text-anchor="end" class="sans" fill="${theme.text}" font-size="18" font-weight="750">${escapeXml(String(item.value))}</text>
        ${index < values.length - 1 ? `<path d="M36 17H620" stroke="${theme.panelBorder}" opacity=".55"/>` : ""}
      </g>`;
  }).join("");

  const updated = new Date(stats.updatedAt).toISOString().slice(0, 10);
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 350" role="img" aria-labelledby="title description">
  <title id="title">Pouls GitHub public de ${escapeXml(config.username)}</title>
  <desc id="description">${stats.publicRepos} dépôts publics, ${stats.originalPublicRepos} projets originaux publics, ${stats.starsEarned} étoiles reçues, ${stats.publicPullRequests} pull requests publiques et ${stats.followers} abonnés. Membre depuis ${stats.memberSince}. Mis à jour le ${updated}.</desc>
  <defs>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.accent}"/><stop offset=".55" stop-color="${theme.accentTwo}"/><stop offset="1" stop-color="${theme.accentThree}"/></linearGradient>
    <radialGradient id="metric-glow"><stop stop-color="${theme.accent}" stop-opacity=".2"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient>
    <symbol id="icon-repo" viewBox="0 0 24 24"><path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v13H7.5A2.5 2.5 0 0 1 5 17.5z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H18M9 8h5"/></symbol>
    <symbol id="icon-project" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M8 4v5"/></symbol>
    <symbol id="icon-star" viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></symbol>
    <symbol id="icon-pull" viewBox="0 0 24 24"><circle cx="6" cy="5" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M6 7.5V16a3 3 0 0 0 3 3h6.5M18 16.5V9a4 4 0 0 0-4-4h-2M14 2l-3 3 3 3"/></symbol>
    <symbol id="icon-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14.5a5 5 0 0 1 3.5 4.8"/></symbol>
  </defs>
  <style>
    .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
    .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
    .ring { stroke-dasharray: 490; stroke-dashoffset: 490; animation: draw-ring 2.4s cubic-bezier(.2,.8,.2,1) forwards, breathe 4.5s ease-in-out 2.4s infinite; }
    .orbit { transform-origin: 955px 188px; animation: orbit 12s linear infinite; }
    .signal-node { animation: node-pulse 3s ease-in-out infinite; }
    @keyframes draw-ring { to { stroke-dashoffset: 62; } }
    @keyframes breathe { 0%, 100% { opacity: .72; } 50% { opacity: 1; } }
    @keyframes orbit { to { transform: rotate(360deg); } }
    @keyframes node-pulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .ring { animation: none; stroke-dashoffset: 62; } .orbit, .signal-node { animation: none; } }
  </style>
  <rect width="1200" height="350" rx="22" fill="${theme.background}"/>
  <text x="60" y="50" class="mono" fill="${theme.accent}" font-size="14" font-weight="700" letter-spacing="3">POULS GITHUB // ${escapeXml(config.username.toUpperCase())}</text>
  <text x="1140" y="50" text-anchor="end" class="mono" fill="${theme.muted}" font-size="11">MIS À JOUR ${updated}</text>
  <rect x="60" y="76" width="680" height="234" rx="18" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
  ${rows}
  <g>
    <circle cx="955" cy="188" r="128" fill="url(#metric-glow)"/>
    <circle cx="955" cy="188" r="78" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="10"/>
    <circle class="ring" cx="955" cy="188" r="78" fill="none" stroke="url(#ring)" stroke-width="10" stroke-linecap="round" transform="rotate(-90 955 188)"/>
    <g class="orbit"><circle cx="955" cy="100" r="5" fill="${theme.accentTwo}"/></g>
    <g class="signal-node" fill="${theme.accent}"><circle cx="934" cy="160" r="5"/><circle cx="976" cy="160" r="5"/><circle cx="955" cy="139" r="5"/></g>
    <path d="M934 160 955 139l21 21-21 25z" fill="none" stroke="${theme.accent}" stroke-width="2" opacity=".8"/>
    <text x="955" y="212" text-anchor="middle" class="sans" fill="${theme.text}" font-size="28" font-weight="800">${stats.memberSince}</text>
    <text x="955" y="235" text-anchor="middle" class="mono" fill="${theme.muted}" font-size="10" font-weight="700" letter-spacing="2">PRÉSENT DEPUIS</text>
    <text x="955" y="304" text-anchor="middle" class="mono" fill="${theme.accentTwo}" font-size="11" font-weight="700" letter-spacing="2">RÉSEAU PUBLIC ACTIF</text>
  </g>
  <rect x="1" y="1" width="1198" height="348" rx="21" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function renderSupport(theme) {
  const buttonBlue = "#1b55a1";
  const coffeeYellow = "#ffdd00";

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 180" role="img" aria-labelledby="title description">
  <title id="title">Soutenir Jordan sur Buy Me a Coffee</title>
  <desc id="description">Un bouton animé pour offrir un café à Jordan Zerathe et soutenir ses projets local-first.</desc>
  <defs>
    <linearGradient id="support-background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.background}"/>
      <stop offset="1" stop-color="${theme.backgroundEnd}"/>
    </linearGradient>
    <linearGradient id="support-signal" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="${theme.accent}"/>
      <stop offset=".52" stop-color="${theme.accentTwo}"/>
      <stop offset="1" stop-color="${theme.accentThree}"/>
    </linearGradient>
    <linearGradient id="support-button" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="${buttonBlue}"/>
      <stop offset="1" stop-color="${theme.accentTwo}"/>
    </linearGradient>
    <radialGradient id="support-glow">
      <stop stop-color="${theme.accentTwo}" stop-opacity=".24"/>
      <stop offset="1" stop-color="${theme.accentTwo}" stop-opacity="0"/>
    </radialGradient>
    <filter id="support-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <style>
    .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
    .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
    .signal { stroke-dasharray: 8 12; animation: support-flow 14s linear infinite; }
    .steam { transform-box: fill-box; transform-origin: center; animation: steam-rise 3.4s ease-in-out infinite; }
    .steam.two { animation-delay: -1.6s; }
    .button { animation: button-pulse 4s ease-in-out infinite; }
    .node { animation: support-node 3.2s ease-in-out infinite; }
    @keyframes support-flow { to { stroke-dashoffset: -160; } }
    @keyframes steam-rise { 0%, 100% { opacity: .18; transform: translateY(5px); } 50% { opacity: 1; transform: translateY(-5px); } }
    @keyframes button-pulse { 0%, 100% { opacity: .9; } 50% { opacity: 1; } }
    @keyframes support-node { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .signal, .steam, .button, .node { animation: none; } }
  </style>
  <rect width="1200" height="180" rx="22" fill="url(#support-background)"/>
  <circle cx="1010" cy="90" r="210" fill="url(#support-glow)"/>
  <path class="signal" d="M36 142C210 86 324 162 500 114S780 54 1164 124" fill="none" stroke="url(#support-signal)" stroke-width="2" opacity=".42"/>
  <g class="node" filter="url(#support-soft-glow)">
    <circle cx="224" cy="121" r="4" fill="${theme.accent}"/>
    <circle cx="500" cy="114" r="5" fill="${theme.accentTwo}"/>
    <circle cx="724" cy="74" r="4" fill="${theme.accentThree}"/>
  </g>
  <text x="58" y="50" class="mono" fill="${theme.accent}" font-size="13" font-weight="700" letter-spacing="2.6">SOUTENIR L’ATELIER // CAFÉ + CODE</text>
  <text x="58" y="92" class="sans" fill="${theme.text}" font-size="28" font-weight="760">Un petit café, un grand signal dans le réseau.</text>
  <text x="58" y="121" class="mono" fill="${theme.muted}" font-size="12.5" letter-spacing=".45">Agents IA · outils local-first · homelab · univers interactifs</text>
  <g class="button" transform="translate(814 48)">
    <rect width="328" height="84" rx="24" fill="url(#support-button)" stroke="${theme.accentTwo}" stroke-opacity=".7"/>
    <g transform="translate(25 18)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 17h33v19a10 10 0 0 1-10 10H16A10 10 0 0 1 6 36z"/>
      <path d="M39 22h5a8 8 0 0 1 0 16h-5"/>
      <path class="steam" d="M15 11c-5-6 5-7 0-13"/>
      <path class="steam two" d="M28 11c-5-6 5-7 0-13"/>
      <path d="M11 22h23" stroke="${coffeeYellow}" stroke-width="4"/>
    </g>
    <text x="88" y="35" class="sans" fill="#ffffff" font-size="18" font-weight="800">M’OFFRIR UN CAFÉ</text>
    <text x="88" y="60" class="mono" fill="#ffffff" fill-opacity=".82" font-size="11.5" font-weight="650" letter-spacing="1.4">BUY ME A COFFEE · ${escapeXml(config.support.handle.toUpperCase())}</text>
  </g>
  <rect x="1" y="1" width="1198" height="178" rx="21" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function renderFooter(theme) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" role="img" aria-labelledby="title description">
  <title id="title">Pied de page du réseau Mycelium</title>
  <desc id="description">Un réseau ramifié discret refermant le profil avec la phrase construire avec intention.</desc>
  <defs>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${theme.accent}"/><stop offset=".55" stop-color="${theme.accentTwo}"/><stop offset="1" stop-color="${theme.accentThree}"/></linearGradient>
  </defs>
  <style>.mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }</style>
  <rect width="1200" height="120" rx="20" fill="${theme.background}"/>
  <g fill="none" stroke="url(#line)" stroke-linecap="round">
    <path d="M0 76C170 18 320 104 495 60S830 16 1200 70" opacity=".55"/>
    <path d="M0 94C220 50 330 126 560 72S916 46 1200 88" opacity=".28"/>
  </g>
  <circle cx="495" cy="60" r="4" fill="${theme.accent}"/>
  <circle cx="804" cy="38" r="4" fill="${theme.accentTwo}"/>
  <rect x="452" y="28" width="296" height="38" rx="19" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
  <text x="600" y="52" text-anchor="middle" class="mono" fill="${theme.text}" font-size="12" font-weight="650" letter-spacing="2">CONSTRUIRE AVEC INTENTION // RESTER HUMAIN</text>
  <rect x="1" y="1" width="1198" height="118" rx="19" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function networkNode(cx, cy, radius, color) {
  return `<circle class="node" cx="${cx}" cy="${cy}" r="${radius}" fill="${color}"/>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
