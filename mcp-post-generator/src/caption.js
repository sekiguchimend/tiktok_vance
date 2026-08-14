// Build an English caption.md for a theme, following a.md's TikTok rules:
//   title  : <= 10 words, one line, ends with a period, no emoji
//   caption: <= 2 sentences, <= 200 chars, no emoji, no CJK
//   order  : conclusion -> reason to swipe (with the count) -> nodeflare.tech (3 free) -> tags
//   tags   : 5-6, no emoji

const BASE_TAGS = ['#tech', '#productivity', '#tools', '#ai', '#developer'];

const TAG_MAP = {
  'AI Tools': ['#aitools', '#ai', '#productivity', '#tech', '#automation'],
  'MCP Servers': ['#mcp', '#ai', '#developer', '#tools', '#automation'],
  'AI Writing': ['#aiwriting', '#writing', '#productivity', '#ai', '#creators'],
  'AI Image': ['#aiart', '#design', '#aitools', '#creative', '#ai'],
  Terminal: ['#developer', '#terminal', '#cli', '#coding', '#devtools'],
  'Self-Hosting': ['#selfhosted', '#homelab', '#privacy', '#opensource', '#tech'],
  'AI Video': ['#aivideo', '#contentcreator', '#editing', '#ai', '#creators'],
  Notes: ['#notetaking', '#productivity', '#secondbrain', '#tools', '#pkm'],
  Automation: ['#automation', '#nocode', '#productivity', '#workflow', '#tech'],
  Research: ['#research', '#productivity', '#ai', '#study', '#tools'],
  'AI Coding': ['#coding', '#ai', '#developer', '#devtools', '#programming'],
  Privacy: ['#privacy', '#security', '#opensource', '#tech', '#dataprivacy'],
  Design: ['#design', '#tools', '#creative', '#nodesigner', '#ux'],
  Productivity: ['#productivity', '#tools', '#focus', '#worksmart', '#tech'],
  Data: ['#data', '#analytics', '#developer', '#tools', '#dataengineering'],
  'AI Audio': ['#aiaudio', '#voiceover', '#podcast', '#ai', '#creators'],
  Marketing: ['#marketing', '#growth', '#creators', '#smallbusiness', '#tools'],
  Learning: ['#learning', '#study', '#productivity', '#tools', '#selfimprovement'],
  Browser: ['#browser', '#extensions', '#productivity', '#tech', '#tools'],
  'Open Source': ['#opensource', '#selfhosted', '#ai', '#developer', '#homelab'],
  APIs: ['#api', '#developer', '#devtools', '#backend', '#coding'],
  Focus: ['#focus', '#deepwork', '#productivity', '#mindfulness', '#tools'],
  DevOps: ['#devops', '#developer', '#cloud', '#infrastructure', '#devtools'],
  'AI Agents': ['#aiagents', '#mcp', '#ai', '#developer', '#automation'],
  Creators: ['#creators', '#writing', '#blogging', '#contentcreator', '#tools'],
  Finance: ['#personalfinance', '#tools', '#money', '#budgeting', '#tech'],
  Teamwork: ['#teamwork', '#startup', '#productivity', '#tools', '#remotework'],
  Security: ['#security', '#privacy', '#cybersecurity', '#tools', '#tech'],
  Startups: ['#startup', '#buildinpublic', '#indiehacker', '#tools', '#saas'],
};

function tagsFor(theme) {
  return TAG_MAP[theme.eyebrow] || BASE_TAGS;
}

// one clean sentence for the theme's payoff
function conclusion(theme) {
  return theme.subtitle.replace(/\s+$/, '');
}

export function buildCaption(theme) {
  const n = theme.items.length;
  const tags = tagsFor(theme).join(' ');
  const titleClean = theme.title.replace(/\n/g, ' ');

  const mk = (title, body) => ({ title, body: `${body}\n\n${tags}` });

  const recommended = mk(
    ensurePeriod(titleClean),
    `${conclusion(theme)} Swipe for all ${n}, including one you have not tried. nodeflare.tech — 3 free.`
  );

  const optionA = mk(
    ensurePeriod(`${n} picks I swear by`),
    `${conclusion(theme)} Number ${n} is the one people sleep on. nodeflare.tech — 3 free.`
  );

  const optionB = mk(
    ensurePeriod(`Save these ${n} before you forget`),
    `${conclusion(theme)} Swipe through and steal my whole stack. nodeflare.tech — 3 free.`
  );

  const optionC = mk(
    ensurePeriod(`${n} tools that changed how I work`),
    `${conclusion(theme)} The last one quietly does the most. nodeflare.tech — 3 free.`
  );

  return { recommended, options: [optionA, optionB, optionC] };
}

function ensurePeriod(s) {
  const t = s.trim();
  return /[.!?]$/.test(t) ? t : t + '.';
}

export function captionMarkdown(theme) {
  const c = buildCaption(theme);
  const block = (label, o) =>
    `## ${label}\n\n**Title**\n\n${o.title}\n\n**Caption**\n\n${o.body}\n`;
  return [
    block('Recommended', c.recommended),
    '---\n',
    block('Option A', c.options[0]),
    '---\n',
    block('Option B', c.options[1]),
    '---\n',
    block('Option C', c.options[2]),
  ].join('\n');
}

// CJK / fullwidth guard (a.md requirement): returns matched strings, [] if clean.
const CJK = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/g;
export function findCJK(text) {
  return text.match(CJK) || [];
}
