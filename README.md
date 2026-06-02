# Sealos App Dev Bridge

Sealos App Dev Bridge is a browser-extension project for local Sealos Desktop app development. It lets provider apps running on `localhost` receive the same `sealos-desktop-sdk` master responses they normally get inside Sealos Desktop, without creating a temporary Sealos App CR that points to `localhost:3000`.

The first implementation target is Chrome Manifest V3.

> [!NOTE]
> This repository is intentionally documentation-first right now. The product, architecture, and runbook are seeded so implementation can start from a clear contract.

## Why

Today, local development of Sealos Desktop apps often requires creating a Sealos App CR in a real cluster with a URL pointed at a local dev server. That keeps the SDK context working, but it adds cluster setup friction, pollutes app lists, and makes multi-cluster testing clumsy.

This project replaces that with a local development bridge:

- Capture authenticated Sealos Desktop session context from a real Desktop page.
- Store multiple environment profiles for production, staging, and test clusters.
- Inject a local SDK master bridge into `localhost` app pages.
- Choose which captured cluster profile the current localhost tab should use.
- Optionally remember a profile for a local origin or port when a stable mapping is useful.

## Core Concepts

**Profile**  
A captured Sealos environment context: Desktop origin, region, workspace, user, session, language, host config, and matching rules.

**Bridge**  
The injected page-side responder that implements the small subset of `sealos-desktop-sdk` master behavior local apps need.

**Current tab selection**  
The profile chosen from the extension popup for the currently open local development tab. This is the default workflow because the same port is often reused against different clusters over time.

**Origin default**  
An optional remembered rule such as `http://localhost:3000 -> test-70` for developers who intentionally want a local origin or port to auto-select a profile.

## MVP Scope

- Chrome MV3 extension.
- Capture current Desktop session into a named profile.
- Support multiple profiles.
- Choose a profile for the current localhost tab from the popup.
- Switch the current tab to another profile and reload safely.
- Optionally remember localhost origins or ports for repeated workflows.
- Respond to SDK APIs:
  - `user.getInfo`
  - `getLanguage`
  - `getHostConfig`
  - `account.getWorkspaceQuota`
  - `event-bus` with safe local fallbacks
- Provide visible errors for missing, stale, or unsafe profile state.

## Out Of Scope

- Creating or editing Sealos App CRs.
- Database writes.
- Cloud resource mutations.
- Replacing Sealos Desktop.
- Provider-specific code forks.
- Storing session data outside the local browser extension storage.

## Documentation

- [Product context](./PRODUCT.md)
- [Design system](./DESIGN.md)
- [Roadmap](./ROADMAP.md)
- [Architecture](./docs/architecture.md)
- [Information architecture](./docs/ia.md)
- [References](./docs/references.md)
- [Runbook](./docs/runbook.md)

## Expected Repository Shape

The implementation can start with this shape:

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
PRODUCT.md
DESIGN.md
ROADMAP.md
AGENTS.md
```

No runtime stack is locked in yet. A TypeScript-first extension is the expected default unless implementation proves a smaller plain-JavaScript build is better.

## Safety Model

The bridge is a local developer tool. It should only capture session context from configured Sealos Desktop origins and only inject into explicitly allowed local development origins such as `localhost` and `127.0.0.1`.

Disabling the extension should restore the provider app's normal standalone behavior.

By default, opening a local app should not permanently bind that port to one cluster. The popup should make the effective profile explicit and let the developer choose or switch the cluster for the current tab.
