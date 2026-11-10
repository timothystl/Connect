# Member sign-in and payment controls

Member login limits, code attempts, code consumption and SSO nonce consumption use atomic D1 statements. A code expires after its original 15-minute lifetime, even after failed guesses; at most five guesses are accepted. Existing KV challenges are invalid after this release: request a fresh code. Expired authentication state is removed in bounded batches during code requests.

Giving checkout and recurring signup require a random UUID intent from the Website giving form. D1 binds that intent to the gift before contacting Stax. Repeated completed intents return their saved result; overlapping or ambiguous attempts never automatically charge again. The same identity is sent as Stax's charge idempotency key. The browser retains only this opaque identifier in session storage across retries and reloads, and blocks simultaneous submissions.

An uncertain outcome requires office reconciliation with the processor before any new gift attempt. Do not delete pending intent records or clear the browser identifier merely to retry. Intent records have no automatic expiry because expiry would permit an old request to charge again. A new tab/device is a new donor intent; this is not deduplication of independently initiated gifts. No real charge or message is used by the regression tests.

Live checkout fails closed if either required Stax credential is missing. Demo gifts remain in the test store. Live multi-fund allocations and unmatched-donor rows commit in one D1 transaction. Valid incomplete historical allocations can be completed only when amounts, fund identities and donor attribution agree; ambiguous records require office review.

Verified single-fund partial refunds reverse only the verified amount. A transaction enforces the cumulative remaining balance and writes the event marker with all negative entries. Partial multi-fund refunds still require an office allocation decision. Existing historical adjustments are not automatically rewritten; reconcile historical incomplete gifts and refunds against processor records separately.

## Release and verification

Deploy the companion Website giving form before Connect. Older open forms without an intent fail closed and must be refreshed. Connect runtime initialization includes the same additive tables/indexes as migrations 0065–0067 and changes its schema fingerprint; check production schema state before release. No existing table is dropped or rewritten. Connect release version is 0.1.0-alpha.25.

Regression coverage exercises concurrent code/SSO consumption, fixed expiration, incomplete configuration, transaction rollback, cumulative refunds, simultaneous/replayed checkout and recurring requests, and a lost processor response. Browser-script tests cover double submission, reload/retry identity and unavailable session storage. Actual processor sandbox behavior, authenticated production user journeys and historical financial reconciliation remain separate operational checks; local mocks cannot establish those outcomes.

References: [D1 batch transaction semantics](https://developers.cloudflare.com/d1/worker-api/d1-database/) and [Stax charge idempotency](https://docs.staxpayments.com/reference/charge-a-payment-method).
