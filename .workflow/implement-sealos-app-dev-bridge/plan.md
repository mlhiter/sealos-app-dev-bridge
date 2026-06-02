# Implement Sealos App Dev Bridge

## Goal

Implement Sealos App Dev Bridge as a working Chrome Manifest V3 extension for local Sealos Desktop app development.

## Success Criteria

- A developer can build an unpacked Chrome extension.
- A developer can capture a Sealos Desktop session from an authenticated Desktop tab into a named local profile.
- A developer can open a localhost provider app tab and choose which captured profile that tab should use from the popup.
- The injected main-world bridge answers the `sealos-desktop-sdk` master message contract for:
  - `user.getInfo`
  - `getLanguage`
  - `getHostConfig`
  - `account.getWorkspaceQuota`
  - safe `event-bus` fallbacks
- Profile selection is tab-first. Remembered local-origin defaults are optional and secondary.
- Session material stays in `chrome.storage.local` and is never sent to a remote service.
- The implementation has focused tests for storage, session normalization, profile resolution, and message response behavior.
- Project docs stay aligned after each feature milestone.

## Current Context

- Repository path: `/Users/mlhiter/personal-projects/sealos-app-dev-bridge`.
- Current branch: `main`.
- Current state before this workflow: documentation-only project.
- Published remote: `git@github.com:mlhiter/sealos-app-dev-bridge.git`.
- Official Chrome extension docs confirm Manifest V3 supports:
  - service worker persisted state via `chrome.storage.local`
  - action popup communication with active tabs
  - `document_start` content scripts
  - `world: "MAIN"` for page-world scripts
- Sealos SDK source confirms apps send `window.top.postMessage` requests with `messageId` and `apiName`, then expect a reply with matching `messageId`, `success`, `message`, and `data`.

## Constraints

- Follow `AGENTS.md` hard rules.
- Do not execute database writes.
- Do not create, update, or delete Sealos App CRs.
- Do not transmit kubeconfig, app token, or captured session data to remote services.
- Injection defaults only to local development origins: `localhost`, `127.0.0.1`, and explicitly configured equivalents.
- Implement in TypeScript.
- Use Chrome Manifest V3.
- Keep profile selection deterministic:
  1. current tab profile selection
  2. remembered local-origin default
  3. active profile fallback
  4. explicit no-profile error
- After every independently completed feature milestone, run the fixed pattern:
  1. `check` skill
  2. `neat-freak` skill
  3. `git-commit` skill

## Risks

- The SDK initializes early, so changing the selected profile after page startup should prompt a tab reload in the MVP.
- Running bridge code in `MAIN` world is powerful. Keep host permissions narrow and logic local-origin gated.
- Captured session payloads include kubeconfig/token. Redact all UI/debug output and avoid sync storage.
- `chrome.storage.local` is asynchronous and MV3 service workers restart. Avoid durable state in globals.
- Exact provider expectations may vary by app. Cover shared SDK initialization first and document unsupported event-bus behavior.

## Approval Required

No extra approval is required for local code edits, tests, commits, or pushing normal commits to the already-created public repository.

Approval would be required before:

- force-pushing
- deleting repositories, branches, or files outside this repo
- publishing a packaged extension
- changing external Sealos cluster state
- touching real credentials beyond reading session data through the intended extension flow

## Work Packets

Packet 1: Extension scaffold and build system.

- Owns `package.json`, lockfile, TypeScript/Vite config, manifest, base extension directories, static assets, and minimal smoke build.
- Completion: `npm run build` produces an unpackable MV3 extension.
- Fixed pattern after completion: check, neat-freak, commit.

Packet 2: Storage, profile capture, and profile resolution.

- Owns shared types/storage modules, Desktop capture content script, background service worker message handlers, and tests for session normalization and profile selection precedence.
- Completion: mocked capture creates profiles and tab-first resolution works.
- Fixed pattern after completion: check, neat-freak, commit.

Packet 3: Main-world SDK bridge and content pipeline.

- Owns localhost content script, injected bridge, bridge bootstrap messaging, SDK API response handlers, event-bus fallbacks, and tests for message response behavior.
- Completion: fixture page can call SDK-shaped messages and receive selected profile responses.
- Fixed pattern after completion: check, neat-freak, commit.

Packet 4: Popup/options UI, documentation, and manual verification fixtures.

- Owns popup/options UI, debug state surfaces, local fixture page, runbook updates, architecture updates, and final build/test/browser verification.
- Completion: current tab can choose/switch profile, reload prompt is visible, origin defaults are secondary, docs match code.
- Fixed pattern after completion: check, neat-freak, commit.

## Integration Policy

- Keep work local in one workspace to avoid conflicts in a brand-new, tightly coupled scaffold.
- Treat packet outputs as independently mergeable milestones.
- Do not let packet N depend on packet N+1 to be useful.
- Keep docs and agent instructions in sync before each milestone commit.
- If a check finds a defect, fix it before committing that milestone.

## Verification

Minimum checks per code milestone:

- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`

Additional final checks:

- Inspect built `extension/dist/manifest.json`.
- Run a local fixture through browser or Node-based tests for SDK message responses.
- Verify workflow completeness with `verify_workflow.py`.
- Confirm public repo sync with `git status --short --branch`.

## Reusable Artifacts

- `.workflow/implement-sealos-app-dev-bridge/` records the implementation workflow.
- A future `.workflow/recipes/chrome-mv3-extension.md` may be added if this produces a reusable extension implementation recipe.
