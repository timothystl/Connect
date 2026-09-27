# Familiar accounting workspace in Finance

The production Finance app serves the established accounting layout at
https://finance.timothystl.org/accounting. The newer Finance pages remain at the
root address. The workspace includes Financial Health, Church Report, Balance
Sheet, Daycare, Commercial Property, Budget, Chart of Accounts, Compensation,
Full Report, and Data & Imports, filtered by the user's existing permissions.

This reuses Connect's source markup and JavaScript to retain its import review,
forecast, property, compensation, CSV and print controls. QuickBooks connection,
sync and transaction controls link to Finance's existing native pages.

Every accounting request receives a live role check. The bounded
`finance-workspace-v1` service contract independently verifies the Access JWT and
active Connect user, then invokes the same permission-checked business handlers.
Council budget writes retain the verified user's private draft identity. Cookies
and caller-supplied usernames or roles are not forwarded. Accounting storage still
uses the authoritative Finance database through the existing storage router.
This adds no data migration or alternate writer.

Deploy Connect before Finance when introducing this contract. Both workers must
contain the matching release. Existing Connect screens remain available while
staff compare the standalone workspace; their eventual retirement and extraction
of the remaining business handlers are separate work.

Validation covers the full repository suite, Finance production dry run, built
script parsing, multipart forwarding, role denials, council private budget
writes, and browser startup/navigation with synthetic local responses. Browser
smoke checks do not establish production data correctness or staff acceptance.
