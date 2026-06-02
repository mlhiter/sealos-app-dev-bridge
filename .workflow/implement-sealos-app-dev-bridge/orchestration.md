# Orchestration: Implement Sealos App Dev Bridge

## Execution Rules

- Keep the original objective intact.
- Ask for approval before risky, expensive, external, or destructive actions.
- Keep immediate blocking work local.
- Delegate only bounded, disjoint, materially useful packets.
- Integrate packet results before final verification.
- For this run, use simulated work packets instead of parallel coding subagents. The repository starts from documentation only, and scaffold files are highly coupled.
- After every independently completed feature milestone, run the fixed pattern: `check` skill, `neat-freak` skill, then `git-commit` skill.

## Branching Rules

- If Chrome API docs or Sealos SDK source contradict the seeded docs, current official docs and local Sealos source win.
- If a milestone cannot pass `npm run build`, do not continue to the next milestone.
- If a milestone changes project commands, update `README.md` and `docs/runbook.md` before committing.
- If bridge behavior changes profile selection, update `AGENTS.md`, `docs/architecture.md`, and `docs/ia.md` before committing.
- If a check finds a hard-stop issue, fix it inside the current milestone and rerun verification.

## Packet Prompts

### Packet 1: Extension Scaffold

Objective: create a TypeScript Chrome MV3 extension scaffold that builds to an unpackable directory.

Do: add package scripts, TS/Vite config, manifest, base source folders, popup/options/injected entrypoints, and minimal tests.

Do not: implement session capture or bridge behavior yet.

Expected output: buildable extension skeleton with documented commands.

### Packet 2: Profile Capture and Resolution

Objective: implement local storage, Desktop session capture, and deterministic tab-first profile selection.

Do: normalize `localStorage.session`, persist profiles in `chrome.storage.local`, support current-tab selection, origin defaults, active fallback, and no-profile errors.

Do not: create Sealos App CRs, remote API calls, or sync storage.

Expected output: tested profile model and background service worker APIs.

### Packet 3: SDK Bridge

Objective: answer Sealos Desktop SDK master messages from localhost tabs.

Do: inject a main-world listener at document start, validate local origin, answer SDK APIs using selected profile state, and expose safe event-bus fallbacks.

Do not: hot-swap app state without reload or inject into non-local origins.

Expected output: tested message responder compatible with the SDK `messageId` contract.

### Packet 4: UI, Docs, and Final Verification

Objective: complete popup/options workflow and align docs with implementation.

Do: build popup profile chooser, capture action, current-tab state, reload prompt, origin defaults UI, debug/redacted profile display, fixture verification, and docs.

Do not: add decorative marketing UI or hide active cluster identity.

Expected output: usable extension with current-tab cluster selection as the primary flow.

## Completion Audit

- [x] Packet 1 implemented and locally verified.
- [x] Packet 1 checked and neat-freaked.
- [ ] Packet 1 committed.
- [ ] Packet 2 complete, checked, neat-freaked, committed.
- [ ] Packet 3 complete, checked, neat-freaked, committed.
- [ ] Packet 4 complete, checked, neat-freaked, committed.
- [ ] Workflow verification complete.
- [ ] Final report written.
