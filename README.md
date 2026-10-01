# Timothy Connect and Finance

This repository contains production Connect, Giving, and Serve/Scheduler. Finance is its own
application in [timothystl/finance](https://github.com/timothystl/finance) (split from this
repository in October 2026 with its full history). Connect remains authoritative for people and
Giving; Finance reads versioned contract summaries from Connect and relays Giving and compensation
writes back to it. The contracts Finance consumes are produced here (`contracts/`, `/api/contracts/*`).

Start with [AGENTS.md](AGENTS.md) for development and release boundaries. Current reference docs:

- [Architecture](docs/ARCHITECTURE.md)
- [Data ownership](docs/DATA-OWNERSHIP.md)
- [Operations](docs/OPERATIONS.md)
- [Security](docs/SECURITY.md)
- [Testing](docs/TESTING.md)
- [Finance (separate repository)](https://github.com/timothystl/finance)

Use Node 22. Install and validate with:

```sh
npm ci
npm test
node .github/scripts/check-built-scripts.js
```

Connect and Finance have separate manual-dispatch production workflows requiring the exact main
SHA and a release reason. Complete routine requested releases under [AGENTS.md](AGENTS.md);
no repeat approval is required. Documentation-only changes need no manual Worker deployment.
