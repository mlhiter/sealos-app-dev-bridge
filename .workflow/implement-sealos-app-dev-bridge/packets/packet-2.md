# Packet 2: Profile Capture and Resolution

Objective: implement local profile persistence, Desktop session capture, and deterministic profile resolution.

Context: Sealos Desktop stores a Zustand-style `localStorage.session` with `state.session`. The SDK's Desktop master normalizes that to `SessionV1`.

Files / sources:

- `extension/src/shared/**`
- `extension/src/background/**`
- `extension/src/content/capture.ts`
- `tests/**`
- `docs/architecture.md`
- `docs/runbook.md`

Ownership: storage schema, session normalization, background APIs, profile selection precedence.

Do:

- Normalize Desktop `localStorage.session` into a profile session.
- Persist profiles, tab selections, origin defaults, and active profile in `chrome.storage.local`.
- Add background message handlers for capture, list, select current tab, remember origin, clear selection, and resolve effective profile.
- Add tests for malformed session payloads and resolution precedence.

Do not:

- Store session material in `chrome.storage.sync`.
- Send session material to remote services.
- Bind one port permanently unless the user explicitly enables an origin default.

Expected output: mocked capture and resolution work without the SDK bridge.

Verification:

- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`
