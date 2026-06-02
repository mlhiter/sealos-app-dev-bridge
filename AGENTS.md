# AGENTS.md

## Project Overview

Sealos App Dev Bridge is a local developer browser extension for Sealos Desktop app development. Its job is to let provider apps running on `localhost` receive the `sealos-desktop-sdk` master responses they normally receive inside Sealos Desktop, without requiring a temporary Sealos App CR pointing at a local dev server.

The first implementation target is a Chrome Manifest V3 extension.

## Current State

As of 2026-06-02, the project has a TypeScript Chrome Manifest V3 scaffold with Vite-based build scripts, Node test runner tests executed through `tsx`, popup/options placeholders, background/content/injected entrypoints, and documentation. Profile capture and SDK bridge behavior are implemented in later milestones.

## Hard Rules

- Do not execute database write operations.
- Do not create, update, or delete Sealos App CRs as part of the default local development flow.
- Do not store captured session data outside browser extension local storage unless the user explicitly approves a new storage design.
- Do not send kubeconfig, app token, or captured session data to any remote service.
- Do not inject into arbitrary websites. Injection should default to local development origins only: `localhost`, `127.0.0.1`, and explicitly configured equivalents.
- Do not treat the extension as an auth bypass. It only reuses a session captured from a real authenticated Sealos Desktop page.
- Keep multi-cluster support in the core design. Single global session storage is not acceptable.
- Current-tab profile selection is the default local development flow. Origin or port bindings are optional automation, not the required path.

## Implementation Defaults

- Prefer TypeScript for extension source.
- Prefer Chrome Manifest V3.
- Prefer small modules:
  - background/service worker for storage and extension APIs
  - content scripts for page/extension boundary
  - main-world injected script for `sealos-desktop-sdk` message bridge
  - popup/options for profile management
- Use `chrome.storage.local` for profile persistence.
- Use `world: "MAIN"` and `run_at: "document_start"` for the page-side bridge when intercepting or answering SDK messages.
- Keep local profile selection deterministic:
  1. current tab profile selection from the popup
  2. remembered profile for the current local origin, including optional origin/port bindings
  3. active profile fallback
  4. no profile error that asks the user to choose in the popup

## Key SDK Contract

Local apps call `createSealosApp()` and then ask the Desktop master for:

- `user.getInfo`
- `getLanguage`
- `getHostConfig`
- `account.getWorkspaceQuota`
- `event-bus`

The bridge should answer these messages in the same shape expected by `sealos-desktop-sdk`.

## Expected Repository Shape

```text
extension/
  manifest.json
  src/
    background/
    content/
    injected/
    popup/
    options/
    shared/
docs/
  architecture.md
  ia.md
  references.md
  runbook.md
AGENTS.md
DESIGN.md
PRODUCT.md
README.md
ROADMAP.md
```

Build output is generated under `extension/dist` and is ignored by git.

## Verification Expectations

Before claiming implementation success:

- Load the extension unpacked in Chrome.
- Capture a profile from a real Sealos Desktop page.
- Open at least one provider app on `localhost`.
- Verify `sealosApp.getSession()` succeeds.
- Verify provider API requests include the expected kubeconfig/session-derived authorization header.
- Verify switching profile changes the local app behavior after reload.
- Verify disabling the extension restores the normal standalone failure behavior.

## Documentation Rules

- Keep `PRODUCT.md`, `DESIGN.md`, `README.md`, `ROADMAP.md`, and `docs/` aligned with implementation changes.
- Update `docs/runbook.md` whenever commands, extension-loading steps, or verification paths change.
- Update `docs/architecture.md` whenever the message bridge, profile model, or storage model changes.
- Update `docs/ia.md` whenever popup/options/debug surfaces change.
