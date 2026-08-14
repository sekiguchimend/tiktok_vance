# post-generator-b (MCP, stdio)

A **stdio** MCP server that generates a TikTok/Instagram carousel in the **a.png
card style** — reproduced **entirely in code** (no image file, no AI image
generation). It picks one of ~30 built-in "listicle" themes (e.g. *"7 AI tools that
feel like cheating"*), renders every slide with `@napi-rs/canvas` at exact size **in
memory**, bundles them into a ZIP, uploads the ZIP to a temporary file host, and hands
back in the tool **response**: the post title + overview as text, the **ZIP download
URL**, and the **cover inline as a preview**. **Nothing is written to disk.**

Bundling one small ZIP link (instead of many big inline images) is what survives host
size caps and code-mode sandboxes, and lets the user grab the whole set at once.

> The ZIP is uploaded to **litterbox** (fallback **0x0.st**), so the link is
> **temporary** — download it soon. See *Uploads & expiry* below.

![preview](assets/preview.png)

## Transport

**stdio** — JSON-RPC over stdin/stdout. This is how stdio→SSE hosts (Nodeflare /
code-mode) launch and bridge it; the ZIP upload only needs **outbound HTTPS**, so no
port is exposed. (This mirrors the sibling `account_a` server.)

## Tools

| Tool | Args | What it does |
|---|---|---|
| `list_themes` | — | Lists the ~30 themes (`id`, `title`, item count). |
| `generate_post` | `themeId?`, `seed?` | Renders a full carousel in memory, bundles all slides + `caption.md` into a ZIP, uploads it to a temporary host, and returns: one text block (title + overview + **ZIP URL**) plus the **cover inline** as a preview. Omit `themeId` for a **random** theme. On any failure it returns `isError` with the actual message. |

## Uploads & expiry

The ZIP is sent to a no-auth temporary file host using Node's built-in `fetch` /
`FormData` — no HTTP library:

- **litterbox** (`litter.catbox.moe`) — primary. Auto-deletes after the TTL; the URL
  expires with it. Allowed TTLs: `1h` / `12h` / `24h` / `72h`, set via
  `MCP_POST_UPLOAD_TTL` (default `72h`, the max).
- **0x0.st** — fallback if litterbox fails. Retention is size-based (~30–365 days;
  smaller files last longer).

⚠️ Both are **temporary** — this is "download it soon" delivery, not permanent
storage. For permanent links, swap the uploader for R2/S3 (easy to add).

## Run

```bash
cd mcp-post-generator
npm install
node src/index.js          # speaks MCP over stdio
```

- `MCP_POST_UPLOAD_TTL` — litterbox TTL: `1h` / `12h` / `24h` / `72h` (default `72h`).

Nothing is written to disk — posts are rendered in memory and the ZIP is uploaded to a
temporary file host.

### Docker

```bash
docker build -t post-generator-b .
docker run --rm -i --init post-generator-b
```

Runs as a non-root user and writes nothing at runtime. It only needs **outbound**
HTTPS to the upload hosts (`litter.catbox.moe`, `0x0.st`).

## Register in an MCP client

Launch the server as a local stdio command:

```json
{
  "mcpServers": {
    "post-generator-b": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-post-generator/src/index.js"]
    }
  }
}
```

Claude Code CLI:

```bash
claude mcp add post-generator-b -- node /absolute/path/to/mcp-post-generator/src/index.js
```

### Host on Nodeflare

It's a plain stdio MCP server, so it deploys straight from a Git URL: Nodeflare runs
it and converts stdio → SSE for clients. No port, no build step (plain ESM) — just
allow outbound HTTPS for the ZIP upload.

## Add or edit themes

Everything lives in `src/themes.js`. Each theme is:

```js
{
  id, eyebrow, title, subtitle, hook /* cover motif */,
  closing: { title, subtitle },
  items: [
    { name, tag, desc /* ~2 sentences */, points: [p1, p2], motif },
    ...
  ],
}
```

`motif` is any icon name from `src/illustrations.js` (`robot`, `plug`, `code`,
`search`, `chart`, `shield`, …). Keep copy English; the build rejects CJK.

## Files

- `src/index.js` — MCP server (stdio); registers the tools, renders → zips → uploads → replies
- `src/generate.js` — `renderPost()`: build slide list → render to PNG buffers in memory (no disk)
- `src/render.js` — paper + blue card + chrome + cover/item/closing layouts
- `src/illustrations.js` — flat line-art icons + the busy cover scene (a.png style)
- `src/themes.js` — the ~30 themes
- `src/caption.js` — English caption.md builder + CJK guard
- `src/zip.js` — dependency-free ZIP writer (STORE method) for bundling the slides
- `src/upload.js` — uploads the ZIP to litterbox (fallback 0x0.st) via built-in fetch/FormData
- `src/config.js` — geometry + palette (measured from a.png)
- `src/fonts.js` — bundled Inter (English)
