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
  await writeSvg(`footer-${name}.svg`, renderFooter(theme));
}

console.log(`Generated 8 SVG assets in ${path.relative(root, outputDirectory)}`);

async function fetchPublicStats(username) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": `${username}-profile-generator`,
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
  }

  const user = await response.json();
  return {
    publicRepos: user.public_repos,
    followers: user.followers,
    memberSince: new Date(user.created_at).getUTCFullYear(),
    updatedAt: new Date().toISOString()
  };
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
  <desc id="description">An animated bioluminescent mycelium network representing local-first AI systems and human control.</desc>
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
    <rect width="520" height="50" rx="25" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
    <circle cx="25" cy="25" r="6" fill="${theme.accent}" filter="url(#soft-glow)"/>
    <text x="44" y="31" class="mono" fill="${theme.text}" font-size="13" font-weight="650" letter-spacing=".7">${escapeXml(config.statement)}</text>
    <rect class="cursor" x="489" y="17" width="8" height="16" rx="1" fill="${theme.accentTwo}"/>
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
    <text x="899" y="237">KNOWLEDGE</text>
    <text x="1022" y="294">HOMELAB</text>
    <text x="1087" y="267">HUMAN GATE</text>
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
  <title id="title">Jordan&apos;s technology toolbox</title>
  <desc id="description">Ten generated badges for the languages, runtimes, infrastructure and platforms used by Jordan.</desc>
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${theme.accent}"/><stop offset=".55" stop-color="${theme.accentTwo}"/><stop offset="1" stop-color="${theme.accentThree}"/></linearGradient>
  </defs>
  <style>.mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }</style>
  <rect width="1200" height="230" rx="22" fill="${theme.background}"/>
  <text x="60" y="48" class="mono" fill="${theme.accent}" font-size="14" font-weight="700" letter-spacing="3">TOOLBOX // BUILD LAYER</text>
  <path d="M904 43H1140" stroke="url(#accent)" stroke-width="2" stroke-linecap="round"/>
  ${rows}
  <rect x="1" y="1" width="1198" height="228" rx="21" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function renderMetrics(theme) {
  const values = [
    { value: stats.publicRepos, label: "PUBLIC REPOSITORIES", color: theme.accent },
    { value: stats.followers, label: "GITHUB FOLLOWERS", color: theme.accentTwo },
    { value: stats.memberSince, label: "BUILDING ON GITHUB SINCE", color: theme.accentThree }
  ];
  const cards = values.map((item, index) => {
    const x = 60 + index * 370;
    return `
      <g transform="translate(${x} 84)">
        <rect width="340" height="118" rx="18" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
        <path d="M0 18Q0 0 18 0H116" fill="none" stroke="${item.color}" stroke-width="3"/>
        <text x="24" y="60" class="sans" fill="${theme.text}" font-size="38" font-weight="750">${escapeXml(String(item.value))}</text>
        <text x="25" y="91" class="mono" fill="${theme.muted}" font-size="12" font-weight="650" letter-spacing="1.5">${item.label}</text>
      </g>`;
  }).join("");

  const updated = new Date(stats.updatedAt).toISOString().slice(0, 10);
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 250" role="img" aria-labelledby="title description">
  <title id="title">Public GitHub pulse for ${escapeXml(config.username)}</title>
  <desc id="description">${stats.publicRepos} public repositories, ${stats.followers} followers, GitHub member since ${stats.memberSince}. Updated ${updated}.</desc>
  <style>
    .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
    .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
  </style>
  <rect width="1200" height="250" rx="22" fill="${theme.background}"/>
  <text x="60" y="47" class="mono" fill="${theme.accent}" font-size="14" font-weight="700" letter-spacing="3">PUBLIC PULSE // ${escapeXml(config.username.toUpperCase())}</text>
  <text x="1140" y="47" text-anchor="end" class="mono" fill="${theme.muted}" font-size="11">UPDATED ${updated}</text>
  ${cards}
  <rect x="1" y="1" width="1198" height="248" rx="21" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function renderFooter(theme) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" role="img" aria-labelledby="title description">
  <title id="title">Mycelium network footer</title>
  <desc id="description">A subtle branching network closing the profile with the phrase build with intent.</desc>
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
  <text x="600" y="52" text-anchor="middle" class="mono" fill="${theme.text}" font-size="12" font-weight="650" letter-spacing="2">BUILD WITH INTENT // STAY HUMAN</text>
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
