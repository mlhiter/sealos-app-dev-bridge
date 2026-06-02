# Roadmap

## Current Stage

Sealos App Dev Bridge has a TypeScript Chrome MV3 MVP with profile storage, Desktop session capture, tab-first profile resolution, the localhost SDK bridge, and popup/options workflows. The next implementation focus is live manual verification against real Sealos provider apps and hardening.

## Phase 1: Minimal Local Bridge

Goal: make one local provider app initialize successfully from a captured Desktop session.

- Create Chrome MV3 extension scaffold. Done in the initial implementation milestone.
- Add configured Desktop origin capture. Done in the profile capture milestone.
- Read and normalize `localStorage.session` into SDK `SessionV1`. Done in the profile capture milestone.
- Persist profiles in `chrome.storage.local`. Done in the profile capture milestone.
- Inject a `document_start` main-world bridge into `localhost` and `127.0.0.1`. Done in the SDK bridge milestone.
- Respond to `user.getInfo`, `getLanguage`, and `getHostConfig`. Done in the SDK bridge milestone.
- Add minimal popup showing capture state and the profile selected for the current tab. Done in the UI milestone.
- Let the popup assign or switch the current tab profile, with a reload prompt when needed. Done in the UI milestone.
- Verify with a local DevBox or DBProvider page. Fixture support is implemented; real provider verification remains manual.

Merge condition: a developer can open a local app page directly, choose a captured profile for that tab from the popup, reload, and avoid the "not running in desktop" redirect path.

## Phase 2: Multi-profile Workflow

Goal: make online, staging, and test clusters first-class.

- Add profile list, rename, delete, refresh, and active profile switching.
- Remember the last profile used for a local origin as a convenience default.
- Add optional origin or port defaults for stable repeated workflows.
- Use current-tab selection before any remembered origin or active-profile fallback.
- Show profile identity in popup: Desktop origin, region UID, workspace, namespace, and user.
- Add stale/expired profile warnings.
- Verify switching the same local origin between at least two Sealos environments.

Merge condition: the same `localhost:3000` tab can be switched between captured profiles without manual token copying, and optional origin defaults do not block explicit tab switching.

## Phase 3: SDK Coverage And Fallbacks

Goal: cover the shared provider behaviors that happen after initialization.

- Implement `account.getWorkspaceQuota` with cached or fetched quota strategy. MVP safe zero-quota fallback is implemented.
- Implement `event-bus` local fallbacks for `openDesktopApp`, `closeDesktopApp`, `requestLogin`, and `quitGuide`. MVP safe no-op fallback is implemented.
- Add optional app-key URL mapping for cross-app local development.
- Add debug panel for last SDK messages and responses.
- Verify DevBox, DBProvider, AppLaunchpad, ObjectStorage, and AIProxy initialization paths.

Merge condition: common cross-app actions fail gracefully or open the configured local/remote target.

## Phase 4: Hardening

Goal: make the tool dependable for daily Sealos frontend work.

- Add import/export of non-secret profile metadata.
- Add session refresh prompts.
- Add origin safety checks and permission minimization.
- Add automated tests for profile selection and message responses.
- Add manual release checklist for unpacked and packaged extension builds.

Merge condition: the bridge is safe enough to use across normal Sealos development without confusing profile leaks.

## Later Ideas

- Firefox support.
- Profile selection history for recently used localhost tabs.
- Workspace switch detection from Desktop.
- Visual in-page debug badge for local pages.
- Optional integration with Sealos frontend monorepo dev scripts.
