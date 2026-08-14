// The 30 post TOPICS (titles only). This MCP does NOT hardcode the content —
// the calling AI picks a topic, researches real, current tools/sites, writes the
// copy, and passes it to render_post to be drawn in the a.png card style.
//
// Fields:
//   id           stable id
//   title        the cover headline (contains the item count, e.g. "7 ...")
//   eyebrow      small label above the cover title
//   hook         suggested cover icon (see MOTIF_NAMES in illustrations.js)
//   count        how many item slides the title implies (match it)
//   nodeflareFit if true, Nodeflare is a natural pick for this topic

export const THEMES = [
  { id: 'ai-tools-cheating', title: '7 AI tools that feel like cheating', eyebrow: 'AI Tools', hook: 'sparkle', count: 7, nodeflareFit: true },
  { id: 'free-sites-illegal', title: '7 free sites that feel illegal to know', eyebrow: 'Free Sites', hook: 'globe', count: 7, nodeflareFit: false },
  { id: 'ai-tools-daily', title: "7 AI tools you'll use every single day", eyebrow: 'AI Tools', hook: 'robot', count: 7, nodeflareFit: true },
  { id: 'free-worth-more', title: '6 free tools worth more than paid ones', eyebrow: 'Free Tools', hook: 'sparkle', count: 6, nodeflareFit: true },
  { id: 'sites-superpowers', title: '7 websites that feel like superpowers', eyebrow: 'Websites', hook: 'bolt', count: 7, nodeflareFit: false },
  { id: 'ai-save-hours', title: '6 AI tools that save you hours a week', eyebrow: 'AI Tools', hook: 'bolt', count: 6, nodeflareFit: true },
  { id: 'underrated-tools', title: '7 underrated tools nobody talks about', eyebrow: 'Underrated', hook: 'magnet', count: 7, nodeflareFit: true },
  { id: 'free-ai-no-catch', title: '6 free AI tools with no catch', eyebrow: 'Free AI', hook: 'sparkle', count: 6, nodeflareFit: true },
  { id: 'ai-boring-work', title: '7 AI tools that do the boring work for you', eyebrow: 'AI Tools', hook: 'gear', count: 7, nodeflareFit: true },
  { id: 'free-replace-paid', title: '6 free sites that replace paid apps', eyebrow: 'Free Sites', hook: 'magnet', count: 6, nodeflareFit: false },
  { id: 'ai-for-creators', title: '7 AI tools for creators', eyebrow: 'AI Tools', hook: 'video', count: 7, nodeflareFit: false },
  { id: 'free-dev-steal', title: '6 free tools every developer should steal', eyebrow: 'Dev Tools', hook: 'code', count: 6, nodeflareFit: true },
  { id: 'replace-a-team', title: '7 tools that replace a whole team', eyebrow: 'Solo Stack', hook: 'rocket', count: 7, nodeflareFit: true },
  { id: 'free-wish-sooner', title: "6 free websites you'll wish you knew sooner", eyebrow: 'Free Sites', hook: 'globe', count: 6, nodeflareFit: false },
  { id: 'automate-boring', title: '7 tools to automate your boring work', eyebrow: 'Automation', hook: 'gear', count: 7, nodeflareFit: true },
  { id: 'ai-save-a-day', title: '6 AI tools that save you a whole day', eyebrow: 'AI Tools', hook: 'rocket', count: 6, nodeflareFit: true },
  { id: 'free-dev-premium', title: '7 free developer tools that feel premium', eyebrow: 'Dev Tools', hook: 'code', count: 7, nodeflareFit: true },
  { id: 'ai-real-powers', title: '6 tools to give your AI real powers', eyebrow: 'AI + Tools', hook: 'plug', count: 6, nodeflareFit: true },
  { id: 'learn-for-free', title: '7 sites to learn anything for free', eyebrow: 'Learning', hook: 'brain', count: 7, nodeflareFit: false },
  { id: 'startups-move-fast', title: '6 AI tools startups use to move fast', eyebrow: 'AI Tools', hook: 'rocket', count: 6, nodeflareFit: true },
  { id: 'save-you-money', title: '7 tools that quietly save you money', eyebrow: 'Money', hook: 'chart', count: 7, nodeflareFit: false },
  { id: 'hidden-ai-power', title: '6 hidden AI tools power users love', eyebrow: 'AI Tools', hook: 'magnet', count: 6, nodeflareFit: true },
  { id: 'run-your-own', title: '7 free tools to run your own stuff', eyebrow: 'Self-Host', hook: 'cloud', count: 7, nodeflareFit: true },
  { id: 'ai-like-magic', title: '6 AI tools that feel like actual magic', eyebrow: 'AI Tools', hook: 'wand', count: 6, nodeflareFit: true },
  { id: 'builder-bookmarks', title: '7 sites every builder should bookmark', eyebrow: 'Websites', hook: 'rocket', count: 7, nodeflareFit: true },
  { id: 'ship-solo', title: '6 tools to ship a product solo', eyebrow: 'Solo Stack', hook: 'rocket', count: 6, nodeflareFit: true },
  { id: 'better-than-popular', title: '7 AI tools better than the popular ones', eyebrow: 'AI Tools', hook: 'sparkle', count: 7, nodeflareFit: true },
  { id: 'make-ai-useful', title: '6 free tools that make AI actually useful', eyebrow: 'AI + Tools', hook: 'plug', count: 6, nodeflareFit: true },
  { id: 'wont-believe-free', title: "7 tools you won't believe are free", eyebrow: 'Free Tools', hook: 'sparkle', count: 7, nodeflareFit: true },
  { id: 'cant-work-without', title: "6 AI tools I can't work without", eyebrow: 'AI Tools', hook: 'sparkle', count: 6, nodeflareFit: true },
];

// Concise, accurate facts so the AI can describe Nodeflare correctly when it fits.
export const NODEFLARE_FACTS =
  'Nodeflare is MCP HOSTING (not an MCP server): it deploys any stdio MCP server ' +
  'as a hosted SSE endpoint straight from a GitHub URL, gives AI real tools with ' +
  'per-method allow/deny (tokens + OAuth), encrypted shared env vars, and full ' +
  'access logs on every call. Firecracker microVMs, cold start under 500ms, 3 ' +
  'servers free. Describe it as the hosting/agent-tools layer, one pick among many.';

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || null;
}

export function listThemes() {
  return THEMES.map((t) => ({ id: t.id, title: t.title, items: t.count, eyebrow: t.eyebrow, nodeflareFit: t.nodeflareFit }));
}
