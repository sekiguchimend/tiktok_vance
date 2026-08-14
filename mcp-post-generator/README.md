# post-generator-b (MCP, stdio)

A **stdio** MCP server that is a **post renderer, not a content database**. It gives
the calling AI **30 post topics** (titles) and a **renderer**. The AI picks a topic,
**researches real, current tools/sites and writes the copy itself**, then calls
`render_post` — which draws that content in the **a.png card style** (reproduced
entirely in code, 1080×1320), bundles the slides into a ZIP, uploads it to a
temporary file host, and returns the **ZIP download URL** + the **cover inline** as a
preview.

**The AI owns the content; this server owns the pixels.** Nothing is hardcoded per
topic and nothing is written to disk.

![preview](assets/preview.png)

## Flow

1. `list_themes` (or `pick_theme`) → choose one of the 30 titles, e.g. *"7 AI tools
   that feel like cheating"*.
2. The AI researches the 7 real tools and writes each `{ name, tag, desc, points,
   motif }` — all in **English**.
3. `render_post` → styled carousel → ZIP uploaded → download URL + cover preview.

## Tools

| Tool | Args | What it does |
|---|---|---|
| `list_themes` | — | The 30 topics (`id`, `title`, item count, `eyebrow`, `nodeflareFit`). |
| `pick_theme` | `seed?` | One random topic + guidance on how to fill it in + the valid motif icon names. |
| `render_post` | `title`, `items[]`, `eyebrow?`, `subtitle?`, `hook?`, `closing?`, `caption?`, `seed?` | Renders AI-authored content, zips + uploads it, returns the ZIP URL + the cover inline. All text must be English (CJK is rejected). |

`render_post` item shape: `{ name, tag?, desc, points?: string[], motif? }`, one per
slide. `motif`/`hook` are icon names (see `src/illustrations.js`): `robot`, `plug`,
`code`, `search`, `chart`, `shield`, `chat`, `image`, `video`, `mic`, `pen`, `doc`,
`brain`, `bolt`, `globe`, `gear`, `rocket`, `sparkle`, `magnet`, … (unknown names
fall back to a default icon).

### Nodeflare

`nodeflareFit` marks topics where Nodeflare is a natural pick. Nodeflare is **MCP
hosting**, not an MCP server — describe it as the hosting/agent-tools layer (host any
stdio MCP server as an SSE endpoint from a GitHub URL, per-method auth, full logs, 3
free). `pick_theme` returns the accurate fact sheet to use.

## Uploads & expiry

The ZIP is sent to a no-auth temporary file host via Node's built-in `fetch` /
`FormData` (no HTTP library):

- **litterbox** (`litter.catbox.moe`) — primary. TTL `1h`/`12h`/`24h`/`72h` via
  `MCP_POST_UPLOAD_TTL` (default `72h`). The URL expires with the file.
- **0x0.st** — fallback; size-based retention (~30–365 days).

⚠️ Temporary — "download it soon". For permanent links, swap in R2/S3.

## Run

```bash
cd mcp-post-generator
npm install
node src/index.js          # speaks MCP over stdio
```

### Docker

```bash
docker build -t post-generator-b .
docker run --rm -i --init post-generator-b
```

Runs as a non-root user, writes nothing at runtime, and only needs **outbound**
HTTPS to the upload hosts.

## Register in an MCP client

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

### Host on Nodeflare

A plain stdio MCP server — deploys straight from a Git URL (Nodeflare runs it and
converts stdio → SSE). No port, no build step; just allow outbound HTTPS for the ZIP
upload.

## Files

- `src/index.js` — MCP server (stdio): `list_themes`, `pick_theme`, `render_post`
- `src/themes.js` — the 30 topics (titles only) + the Nodeflare fact sheet
- `src/generate.js` — `renderContent()`: AI content → PNG buffers in memory (English-only guard)
- `src/render.js` — paper + blue card + chrome + cover/item/closing layouts
- `src/illustrations.js` — flat line-art icons + the busy cover scene (a.png style)
- `src/zip.js` — dependency-free ZIP writer (STORE)
- `src/upload.js` — uploads the ZIP to litterbox (fallback 0x0.st)
- `src/caption.js` — the English-only (CJK) guard
- `src/config.js` — geometry + palette (measured from a.png)
- `src/fonts.js` — bundled Inter (English)
