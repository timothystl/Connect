// Donor letters: what Finance asks Connect for, and how a set of chosen recipients becomes
// rendered letters (for an email run, a print run, or marking). Connect answers through
// giving-letters-v1 and delivers through giving-letters-send-v1 (see
// src/api-giving-letters-contract.js); Finance never stores giving records or addresses.
import { callConnectContract } from './connect-giving-batch-client.js';
import {
  letterSubject, nudgeSubject, receiptSubject, renderNudgeLetter, renderReceiptLetter, renderStatementLetter,
} from './donor-letters.js';

export const EMAIL_BATCH = 20;
export const PRINT_LIMIT = 200;
const STATEMENT_CHUNK = 25;
export const LETTER_KINDS = ['letters', 'receipts', 'nudges'];

export function fetchGivingLetters(env, accessJwt, op, query = {}) {
  const clean = {};
  for (const [k, v] of Object.entries(query)) if (v != null && v !== '') clean[k] = String(v).slice(0, 2000);
  return callConnectContract(env, accessJwt, 'giving-letters-v1', { query: { op, ...clean } });
}
export const postGivingLettersSend = (env, accessJwt, letters) => callConnectContract(env, accessJwt, 'giving-letters-send-v1', { method: 'POST', body: { letters } });
export const postGivingLettersSettings = (env, accessJwt, settings) => callConnectContract(env, accessJwt, 'giving-letters-settings-v1', { method: 'POST', body: settings });
export const postGivingLettersMark = (env, accessJwt, marks, unmark = false) => callConnectContract(env, accessJwt, 'giving-letters-mark-v1', { method: 'POST', body: { marks, unmark } });

const isDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
const pick = (value, allowed, def) => (allowed.includes(value) ? value : def);

// The choices on each letters page, validated (Connect validates again).
export function lettersParams(get, today) {
  const thisYear = Number(today.slice(0, 4));
  const y = Number(get('year'));
  const year = Number.isInteger(y) && y >= 2000 && y <= thisYear + 1 ? y : thisYear;
  const monthStart = `${today.slice(0, 7)}-01`;
  const threshold = Number(get('threshold'));
  return {
    today, thisYear, year,
    type: pick(get('type'), ['year_end', 'midyear', 'quarterly', 'thank_you', 'appeal', 'memorial'], 'year_end'),
    scope: pick(get('scope'), ['givers', 'member_households', 'both'], ''),
    channel: pick(get('channel'), ['email', 'print'], 'email'),
    through: isDay(get('through')) ? get('through') : '',
    from: isDay(get('from')) ? get('from') : monthStart,
    to: isDay(get('to')) ? get('to') : today,
    threshold: Number.isFinite(threshold) && threshold >= 0 ? Math.round(threshold) : 250,
    firstGift: get('first_gift') !== '0',
    fund: /^\d{1,9}$/.test(get('fund_id') || '') ? get('fund_id') : '',
    nudgeScope: pick(get('scope'), ['household', 'person'], 'household'),
    option: pick(get('option'), ['modest', 'standard', 'generous'], 'standard'),
  };
}

export function listQuery(kind, p) {
  if (kind === 'receipts') return ['receipts', { from: p.from, to: p.to, threshold_cents: p.threshold * 100, first_gift: p.firstGift ? '1' : '0' }];
  if (kind === 'nudges') return ['nudges', { year: p.year, scope: p.nudgeScope, fund_id: p.fund, channel: p.channel, option: p.option }];
  return ['status', { year: p.year, letter_type: p.type, channel: p.channel, ...(p.scope ? { scope: p.scope } : {}) }];
}

export function rowsOf(kind, data) {
  return (kind === 'receipts' ? data?.receipts : data?.recipients) || [];
}

// Everything needed to send, print or mark the chosen recipients, in the order they were listed.
export async function buildLetters(env, accessJwt, kind, p, keys, { render = true } = {}) {
  const [op, query] = listQuery(kind, p);
  const [list, config] = await Promise.all([
    fetchGivingLetters(env, accessJwt, op, query),
    render ? fetchGivingLetters(env, accessJwt, 'config') : Promise.resolve({ ok: true, result: {} }),
  ]);
  if (!list.ok) return { error: list };
  if (!config.ok) return { error: config };
  const wanted = new Set(keys);
  const rows = rowsOf(kind, list.result).filter((r) => wanted.has(r.recipient_key));
  const cfg = config.result;
  const base = (r) => ({
    recipient_key: r.recipient_key, to_email: r.email || '', to_name: r.recipient_name || r.name || '',
    person_id: r.kind === 'household' ? (r.recipient_person_id || 0) : (r.person_id || r.id || 0),
    household_id: r.kind === 'household' ? r.id : (r.household_id || null), name: r.name, has_email: !!r.has_email, sent: !!r.sent,
  });
  if (kind === 'receipts') {
    return { config: cfg, letters: rows.map((r) => ({ ...base(r), person_id: r.person_id, year: Number(String(r.gift_date).slice(0, 4)), letter_type: 'thank_you',
      subject: receiptSubject(cfg), html: render ? renderReceiptLetter(r, cfg) : '' })) };
  }
  if (kind === 'nudges') {
    return { config: cfg, letters: rows.map((r) => ({ ...base(r), year: p.year, letter_type: 'nudge',
      subject: nudgeSubject(cfg), html: render ? renderNudgeLetter(r, cfg) : '' })) };
  }
  if (!render) return { config: cfg, letters: rows.map((r) => ({ ...base(r), year: p.year, letter_type: p.type })) };
  const statements = new Map();
  for (let i = 0; i < rows.length; i += STATEMENT_CHUNK) {
    const chunk = rows.slice(i, i + STATEMENT_CHUNK).map((r) => r.recipient_key);
    const res = await fetchGivingLetters(env, accessJwt, 'statements', { year: p.year, keys: chunk.join(','), through: p.through });
    if (!res.ok) return { error: res };
    for (const s of res.result.statements || []) statements.set(s.key, s);
  }
  const letters = rows.filter((r) => statements.has(r.recipient_key)).map((r) => ({
    ...base(r), year: p.year, letter_type: p.type,
    subject: letterSubject(p.type, p.year, cfg.church_name), html: renderStatementLetter(statements.get(r.recipient_key), p.type, cfg, p.today),
  }));
  return { config: cfg, letters };
}
