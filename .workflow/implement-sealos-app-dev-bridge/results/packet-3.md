# Packet 3 Result: SDK Bridge

## Accepted

- Added a tested SDK responder for `user.getInfo`, `getLanguage`, `getHostConfig`, `account.getWorkspaceQuota`, and `event-bus`.
- Added a main-world injected listener that catches same-window SDK messages at localhost.
- Added an isolated content-script bridge that forwards SDK requests to the background service worker.
- Added background handling for SDK requests using the existing tab-first profile resolution.
- Added recent SDK message logging in extension storage with message metadata only.
- Added tests for SDK response shapes, host config `regionUid` casing, quota fallback, safe event-bus fallback, no-profile errors, and unsupported SDK APIs.

## Rejected

- Did not expose Chrome APIs or profile storage directly to the main-world script.
- Did not hot-swap a running app after profile changes. Reload remains the MVP path.
- Did not fetch live workspace quota remotely. MVP returns a safe zero-quota fallback.

## Verification

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm audit --audit-level=moderate`
- `git diff --check`

All listed checks passed before entering Packet 3 fixed-pattern review. The Packet 3 fixed pattern ran `check` and `neat-freak`; commit is the next action.

## Remaining Risk

- Browser-level extension smoke is covered by Packet 4's automated Playwright Chromium run. Real authenticated Sealos Desktop capture still needs the user's logged-in Chrome profile or a live Desktop session.
