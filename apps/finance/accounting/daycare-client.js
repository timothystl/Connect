// Finance's own copy of Connect's src/daycare.js (forked 2026-09-29), so Finance reads and writes its
// accounting records itself instead of asking Connect. Connect's copy serves only its remaining
// in-Connect Budget/Compensation screens and is retired with them; change this one, not that one.
// Daycare app finance API client — a separate Claude-Code-built app with its own bookkeeping.
// Mirrors makeBreezeClient's null-when-unconfigured convention. See SECRETS.md for the
// response contract. DAYCARE_API_URL is the COMPLETE endpoint URL (not a base domain to
// append a path to) — the daycare app's actual implementation is a Supabase Edge Function
// at its own specific path (e.g. https://<project>.supabase.co/functions/v1/finance-summary),
// not a fixed /api/finance/summary route on a conventional host.
// Finance's own settings use myMDO's name (Andrew, 2026-09-29): MYMDO_API_URL, MYMDO_API_KEY and,
// if the rooms endpoint is ever built, MYMDO_ROOMS_API_URL. Connect's DAYCARE_* names still work.
const url = (env) => env.MYMDO_API_URL || env.DAYCARE_API_URL || '';
const key = (env) => env.MYMDO_API_KEY || env.DAYCARE_API_KEY || '';
const roomsUrl = (env) => env.MYMDO_ROOMS_API_URL || env.DAYCARE_ROOMS_API_URL || '';

export function daycareConfigured(env) {
  return !!(url(env) && key(env));
}

// The rooms URL is a SECOND complete endpoint URL, separate from the summary one above,
// for the room-level monthly aggregates the rebuilt Daycare Report reads (capacity/day, average
// daily enrolled, billed revenue, labor cost, waitlist count — see DAYCARE_API.md in the design
// handoff). It does not exist in the daycare app yet; until it is built and the secret is set,
// `rooms` is simply absent from the client and the report degrades to its category-by-year table.
export function daycareRoomsConfigured(env) {
  return !!(roomsUrl(env) && key(env));
}

export function makeDaycareClient(env) {
  if (!daycareConfigured(env) && !daycareRoomsConfigured(env)) return null;
  const headers = { 'X-Api-Key': key(env), 'Accept': 'application/json' };
  const client = {};
  if (daycareConfigured(env)) client.summary = () => fetch(url(env), { headers });
  if (daycareRoomsConfigured(env)) client.rooms = () => fetch(roomsUrl(env), { headers });
  return client;
}
