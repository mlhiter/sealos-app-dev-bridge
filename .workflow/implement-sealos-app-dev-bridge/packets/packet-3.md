# Packet 3: SDK Bridge

Objective: answer Sealos Desktop SDK master messages from localhost tabs.

Context: the app-side SDK sends messages with `messageId` and `apiName` through `window.top.postMessage`. In standalone localhost tabs, `window.top === window`, so the bridge must answer same-window messages in main world.

Files / sources:

- `extension/src/content/**`
- `extension/src/injected/**`
- `extension/src/shared/**`
- `tests/**`
- `docs/architecture.md`
- `docs/runbook.md`

Ownership: content-to-background handshake, injected main-world bridge, SDK API response behavior, debug log shape.

Do:

- Inject the bridge at `document_start`.
- Validate local development origins.
- Resolve profile state before answering SDK messages.
- Reply with matching `messageId`, `success`, `message`, `data`, and `masterOrigin`.
- Support safe local fallbacks for event-bus actions.
- Add tests for supported and unsupported SDK messages.

Do not:

- Inject into arbitrary websites.
- Hot-swap a running app without reload.
- Log full kubeconfig or token.

Expected output: a fixture or test can send SDK-shaped messages and receive profile-backed responses.

Verification:

- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`
