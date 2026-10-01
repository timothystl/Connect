# Timothy Connect

Connect is the church's people and giving system: people and households, Giving, volunteer
Serve/Scheduler, the member directory, and the versioned data contracts other apps consume. It runs
as the Cloudflare Worker `timothy-connect` (entry point `connect-worker.js`) at
`connect.timothystl.org`, with public Serve pages on `serve.timothystl.org`.

Related apps live in their own repositories:

- [Finance](https://github.com/timothystl/finance) (`timothy-finance-app`): accounting, budgets,
  planning, property, payroll processing. Split out of this repository on October 1, 2026 with its
  full history. Finance reads contract summaries from Connect and relays Giving writes back to it.
  The older Finance screens still inside Connect (`src/api-finance.js`, `src/frontend/js-finance.js`)
  are a compatibility layer; see [Architecture](docs/ARCHITECTURE.md).
- [Website](https://github.com/timothystl/website): public site, Website Admin, newsletters, payroll backend.
- [myMDO](https://github.com/timothystl/myMDO): childcare product.
- [app-launcher](https://github.com/timothystl/app-launcher) and
  [ministry-study](https://github.com/timothystl/ministry-study).

Cross-app architecture and plans are in
[digital-architecture](https://github.com/timothystl/digital-architecture).

## Documents

- [AGENTS.md](AGENTS.md): working rules for people and coding agents
- [Architecture](docs/ARCHITECTURE.md), [Data ownership](docs/DATA-OWNERSHIP.md),
  [Operations](docs/OPERATIONS.md), [Security](docs/SECURITY.md), [Testing](docs/TESTING.md),
  [Versioning](docs/VERSIONING.md)
- [Secrets and settings reference](SECRETS.md) (names and ownership only) and
  [Cloudflare token map](docs/CLOUDFLARE_TOKENS.md)
- [Open work](docs/OPEN-WORK.md) and [decision records](docs/adr/)
- [Architecture records](architecture/README.md): dated cross-app planning snapshots

## Develop and release

Use Node 22.

```sh
npm ci
npm test
node .github/scripts/check-built-scripts.js
```

Merging to `main` does not deploy. A release is the manual `deploy.yml` workflow, run with the exact
tested `main` SHA and a release reason. Documentation-only changes need no deployment.
