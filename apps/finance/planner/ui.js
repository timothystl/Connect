// Markup helpers shared by the views. Handlers are named in data attributes, never inline
// JavaScript, so the page runs under a script-src 'self' policy with no 'unsafe-inline'.
import { ACTIONS } from './actions.js';
import { esc } from './format.js';
import { canEdit, canEditPlanControls } from './state.js';

export function allowed(who) {
  if (who === 'plan') return canEditPlanControls();
  if (who === 'edit') return canEdit();
  return true;
}

function dataAttrs(data) {
  return Object.keys(data || {}).map((k) => ' data-' + k + '="' + esc(data[k]) + '"').join('');
}

// A clickable element's attributes, or nothing when this viewer may not take the action (so it
// neither looks nor behaves clickable).
export function act(name, data) {
  const a = ACTIONS[name];
  if (!a || !allowed(a.who)) return '';
  return ' data-act="' + name + '"' + dataAttrs(data) + ' role="button" tabindex="0"';
}
// Inputs and selects carry their handler always; readOnlyUnless() disables them for a viewer who
// may not edit, the way legacy did.
export const onInput = (name, data, sanitize) => ' data-input="' + name + '"' + dataAttrs(data) + (sanitize ? ' data-sanitize="' + sanitize + '"' : '');
export const onChange = (name, data) => ' data-change="' + name + '"' + dataAttrs(data);

export function readOnlyUnless(html, ok) {
  if (ok) return html;
  return html.replace(/<input /g, '<input disabled ').replace(/<select /g, '<select disabled ');
}
export const readOnly = (html) => readOnlyUnless(html, canEdit());

export function option(value, label, selected) {
  return '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + label + '</option>';
}
