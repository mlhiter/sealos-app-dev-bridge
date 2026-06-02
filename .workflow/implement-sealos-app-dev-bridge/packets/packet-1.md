# Packet 1: Extension Scaffold and Build System

Objective: create a TypeScript Chrome Manifest V3 extension scaffold that builds to an unpackable directory.

Context: the repository starts documentation-only. Use a minimal TypeScript plus Vite stack so the extension remains easy to audit.

Files / sources:

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `extension/manifest.json`
- `extension/src/**`
- `tests/**`
- `README.md`
- `docs/runbook.md`

Ownership: build system, base entrypoints, static manifest, and baseline commands.

Do:

- Add package scripts for typecheck, test, build, and clean.
- Add MV3 manifest with service worker, popup/options pages, narrow localhost content script matches, and `world: "MAIN"` where needed.
- Add placeholder entrypoints that compile without real bridge logic.
- Add one baseline test proving the test runner is wired.
- Update docs for initial commands.

Do not:

- Implement session capture.
- Implement SDK response behavior.
- Add broad host permissions.

Expected output: `npm run build` emits a loadable unpacked extension directory.

Verification:

- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`
