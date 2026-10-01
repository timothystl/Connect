# ADR 0001: Timothy Workspace "Open Sky" design system for Connect

Status: accepted. Date: 2026-09-25 (decisions with Andrew). Source: former `PLAN.md`, section
"Timothy Workspace Open Sky adoption in Connect" (`git show c79214f:PLAN.md`).

## Context

Connect's staff screens carried several overlapping palettes and fonts. The church-app family received
an approved design system, Timothy Workspace v1.0 ("Open Sky"), delivered 2026-09-24 as a design kit
(its design-system document and tokens are canonical).

## Decision

- Adopt Open Sky for Connect staff screens, replacing the earlier navy/teal/cream palette and its
  fonts. Public Serve and website pages and all myMDO products are outside its scope.
- Plain JavaScript and CSS; no React. Keep the phone shell (`src/mobile-admin-html.js`) and restyle it.
- Keep the sidebar sections (People, Finance, Ministry, Admin) and routes. Leave the legacy in-Connect
  Finance screens' layouts alone because Finance is moving out.
- People stays person-first. Keep every filter and bulk action; drop the Card and Household views.
  Person, household, and organization pages edit one section at a time. "Groups" are tags. No volunteer
  schedule, per-person attendance, or activity timeline on the person page. Member type is a plain text
  label. No emoji.
- Directory visibility keeps the existing flags (no publish step).
- A redesign of Home as an agenda/"needs attention" view was deferred, then Home was rebuilt around
  Sunday attendance entry and the month's birthdays and anniversaries.

## Consequences

Legacy token names are aliased onto the Open Sky tokens so every screen moved at once. Remaining
old-look areas and token cleanup are listed in [Open work](../OPEN-WORK.md). Printed letters,
certificates, and email bodies intentionally keep their own styling.
