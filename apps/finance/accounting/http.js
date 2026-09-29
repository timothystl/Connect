// JSON responses for Finance's accounting handlers (apps/finance/accounting/). These answer
// Finance's own server code and the accounting workspace's same-origin fetches, never a page.
const HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store',
};

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...HEADERS, ...extraHeaders } });
}

// Connect's session lookup. Finance never has a Connect session: every accounting handler here is
// called with the verified actor Finance resolved from Cloudflare Access, so there is no fallback.
export async function getAuthInfo() {
  return null;
}
