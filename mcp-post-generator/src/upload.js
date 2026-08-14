// Upload the ZIP to a no-auth temporary file host and return a public URL.
// Primary: litterbox (litter.catbox.moe) — temp only, TTL 1h/12h/24h/72h.
// Fallback: 0x0.st — retention is size-based (~30-365 days).
// Uses Node's built-in fetch / FormData / Blob (no HTTP library).
//
// NOTE: these are TEMPORARY hosts, meant for "download it soon" delivery.
// For permanent links, swap in R2/S3.
//
// Env: MCP_POST_UPLOAD_TTL — litterbox TTL, one of 1h | 12h | 24h | 72h (default 72h).

const ALLOWED_TTL = ['1h', '12h', '24h', '72h'];
export const UPLOAD_TTL = ALLOWED_TTL.includes(process.env.MCP_POST_UPLOAD_TTL)
  ? process.env.MCP_POST_UPLOAD_TTL
  : '72h';

const UA = 'mcp-post-generator/1.0 (+https://nodeflare.tech)';

async function toLitterbox(buffer, filename) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('time', UPLOAD_TTL);
  form.append('fileToUpload', new Blob([buffer], { type: 'application/zip' }), filename);
  const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
    method: 'POST', body: form, headers: { 'User-Agent': UA },
  });
  const text = (await res.text()).trim();
  if (!res.ok || !/^https?:\/\//.test(text)) throw new Error(`litterbox ${res.status}: ${text.slice(0, 120)}`);
  return { url: text, host: 'litterbox', ttl: UPLOAD_TTL };
}

async function toZeroX0(buffer, filename) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'application/zip' }), filename);
  const res = await fetch('https://0x0.st', {
    method: 'POST', body: form, headers: { 'User-Agent': UA },
  });
  const text = (await res.text()).trim();
  if (!res.ok || !/^https?:\/\//.test(text)) throw new Error(`0x0.st ${res.status}: ${text.slice(0, 120)}`);
  return { url: text, host: '0x0.st', ttl: 'size-based (~30-365d)' };
}

// Returns { url, host, ttl }. Throws only if BOTH hosts fail.
export async function uploadTemp(buffer, filename) {
  try {
    return await toLitterbox(buffer, filename);
  } catch (primary) {
    try {
      return await toZeroX0(buffer, filename);
    } catch (fallback) {
      throw new Error(`upload failed — litterbox: ${primary.message}; 0x0.st: ${fallback.message}`);
    }
  }
}
