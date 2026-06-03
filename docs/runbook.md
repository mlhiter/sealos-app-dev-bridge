# Runbook

## Current Status

As of 2026-06-03, this project has a TypeScript Chrome MV3 MVP with profile storage, Desktop session capture, tab-first profile resolution, main-world SDK bridge behavior, popup/options workflows, selected-profile details in the popup, package scripts, a Vite build pipeline, Node test runner tests executed through `tsx`, and background/content/injected entrypoints.

## Local Commands

Install dependencies:

```bash
npm install
```

Run type checking:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Build the unpacked extension:

```bash
npm run build
```

Package a GitHub Release zip:

```bash
npm run package
```

Verify a release tag matches project versions:

```bash
npm run release:verify-version -- v0.1.0
```

Run the automated extension smoke test:

```bash
npm run smoke:extension
```

Clean generated extension output:

```bash
npm run clean
```

Build output:

```text
extension/dist
```

Release zip output:

```text
release/sealos-app-dev-bridge-<version>.zip
release/sealos-app-dev-bridge-<version>.zip.sha256
```

## Initial Implementation Checklist

1. Choose the extension stack.
   - Default: TypeScript plus a minimal bundler suitable for Chrome MV3.
   - Keep the extension source under `extension/`.
2. Create `extension/manifest.json`.
3. Add background/service worker storage module.
4. Add Desktop capture content script.
5. Add localhost bridge injection.
6. Add popup UI for capture, current-tab profile selection with automatic reload, and selected-profile details display.
7. Add options UI for profiles, optional origin defaults, and SDK message metadata.
8. Add local verification fixtures or tests.

## Manual Chrome Loading

1. Build the extension.
2. Open Chrome extensions page.
3. Enable Developer Mode.
4. Choose "Load unpacked".
5. Select `extension/dist`.
6. Pin the extension action for quick access.

## GitHub Release Distribution

Releases are published by GitHub Actions when a semver tag is pushed:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The release workflow verifies that the tag version matches both `package.json` and `extension/manifest.json`, installs dependencies, installs Playwright Chromium, runs typecheck, tests, build, smoke verification, packages the extension, then creates the GitHub Release with:

- `sealos-app-dev-bridge-<version>.zip`
- `sealos-app-dev-bridge-<version>.zip.sha256`

Before pushing a release tag locally, run:

```bash
npm run release:verify-version -- v0.1.0
npm run typecheck
npm test
npm run build
npm run smoke:extension
npm run package
```

Ask each teammate to:

1. Download `sealos-app-dev-bridge-<version>.zip` from the GitHub Release.
2. Unzip the package.
3. In Chrome, open `chrome://extensions`, enable Developer Mode, choose "Load unpacked", and select the unzipped `sealos-app-dev-bridge` folder.
4. For updates, replace the local unzipped folder contents with the new release contents, then click reload on the extension card.

The manifest includes a fixed public `key`, so Chrome should derive the same extension ID across release zips. Captured profiles still live only in each teammate's own `chrome.storage.local` under that extension ID; they are not included in the release zip.

## Manual Release Packaging

Use this only for local preflight or debugging the release asset:

1. Run the verification commands:
   ```bash
   npm run typecheck
   npm test
   npm run build
   npm run smoke:extension
   ```
2. Package the extension:
   ```bash
   npm run package
   ```

## Profile Capture Verification

1. Open a real Sealos Desktop page.
2. Log in normally.
3. Click the extension popup.
4. Capture the current profile.
   - The popup action is labeled `Capture Desktop Tab`.
   - Capturing automatically trusts the current Desktop origin.
5. Confirm the profile selector itself shows a short human-readable name plus Desktop host, not a profile ID or long region UID.
6. Confirm the selected profile details under the profile selector show:
   - Desktop origin
   - region UID
   - workspace or nsid
   - captured timestamp

Do not continue if the captured profile does not clearly identify the environment.

## Local App Verification

Automated fixture path:

1. Build the extension:
   ```bash
   npm run build
   ```
2. Run:
   ```bash
   npm run smoke:extension
   ```
3. Confirm the JSON output reports `ok: true`, successful SDK replies while the extension is enabled, and a failed standalone `user.getInfo` self-message under `disabledStandalone` when the extension is disabled.

Manual provider path:

1. Start a Sealos provider app locally, for example on `http://localhost:3000`, or serve the fixture:
   ```bash
   npx --yes http-server extension/fixtures -p 3000
   ```
2. Open the local page directly in a new tab.
3. Open the extension popup on that tab.
4. Choose the intended captured profile for the current tab.
5. Click `Use For This Tab`; the popup should save the current-tab selection, reload the local tab, and close.
6. Verify the app does not show the standalone-use redirect or modal.
7. In browser devtools, confirm SDK calls receive successful responses.
   - `user.getInfo` returns the selected profile session.
   - `getLanguage` returns the selected profile language.
   - `getHostConfig` returns the selected profile host config with `regionUid`.
   - `account.getWorkspaceQuota` returns the MVP safe zero-quota fallback.
   - known `event-bus` app events return a safe local no-op response.
8. Confirm provider API requests include the expected session-derived authorization header.
9. Switch the current tab to another profile and confirm behavior follows the new profile after the automatic reload.
10. Disable the extension and reload to confirm normal standalone failure behavior returns.

## Multi-cluster Verification

1. Capture at least two profiles from different Sealos environments.
2. Open `http://localhost:3000`.
3. Use the popup to select the first profile for the current tab.
4. Confirm the page receives the first environment identity.
5. Use the popup to switch the same tab to the second profile.
6. Confirm the same local origin now receives the second environment identity.
7. If optional origin defaults are enabled, confirm explicit current-tab selection still wins over the remembered default.

## Debugging

### Local page still redirects to Desktop

- Check whether the extension injected at `document_start`.
- Check whether the script ran in the page main world.
- Check whether the local origin is allowed.
- Check whether the current tab has a selected profile, remembered origin default, or active fallback.
- Check recent SDK message logs for `user.getInfo`.

### Wrong cluster is active

- Inspect profile resolution source for the tab.
- Confirm current-tab selection is not stale.
- Confirm local origin includes the correct protocol and port.
- Confirm remembered origin default or active profile fallback is not being used unexpectedly.
- Confirm the Current Tab panel shows the expected profile source for the current tab.

### API calls are unauthorized

- Confirm `getSession()` returned a profile with `kubeconfig`.
- Confirm the provider request interceptor reads the same session store it initializes from SDK response.
- Confirm the target provider expects kubeconfig in `Authorization` and not a different token-only path.
- Confirm the profile was captured from the intended workspace.

## Safety Checks

- Do not log full kubeconfig or app token.
- Redact secrets in debug output.
- Do not use `chrome.storage.sync` for session payloads.
- Do not add broad host permissions without a specific reason.
- Do not capture from unknown origins.

## Release Notes Template

Use this when a packaged extension exists:

```markdown
## Version

### Added

### Changed

### Fixed

### Verification

### Known Issues
```
