# Testing

Use Node 22. For every repository change:

```sh
npm ci
npm test
node .github/scripts/check-built-scripts.js
```

Add focused tests for the changed route, permission, schema, failure, or frontend path. Confirm a
regression test fails on the prior behavior and does not pass vacuously.

Finance application tests live in [timothystl/finance](https://github.com/timothystl/finance).
The `test/finance-*` files here cover Connect's legacy Finance handlers and contract producers.

For configuration-only changes, also dry-run the affected Worker configuration
(`npx wrangler deploy --dry-run --config wrangler.toml`). For database work,
test on disposable/local state first, reconcile schema and control totals, and
record the exact database identity. A passing unit suite does not establish a successful migration,
live authorization, production health, or business-data correctness.

Before a production release, the dispatch workflow repeats the full suite on the exact approved
`main` SHA. Post-release checks must remain bounded and must not expose sensitive records.

Pull-request CI (`validate-changes.yml`) also runs `npm test`, the built-script check, the
`DEPLOY_VERSION` check, and Wrangler `--dry-run` for `wrangler.toml`. This
checks production configuration/binding resolution without uploading or
changing a Worker.
