# Runbook

## Current Status

As of 2026-06-02, this project has a TypeScript Chrome MV3 scaffold with profile storage, Desktop session capture plumbing, tab-first profile resolution, package scripts, a Vite build pipeline, Node test runner tests executed through `tsx`, placeholder popup/options pages, and background/content/injected entrypoints. SDK bridge behavior and full popup/options workflows are still implemented in later milestones.

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

Clean generated extension output:

```bash
npm run clean
```

Build output:

```text
extension/dist
```

## Initial Implementation Checklist

1. Choose the extension stack.
   - Default: TypeScript plus a minimal bundler suitable for Chrome MV3.
   - Keep the extension source under `extension/`.
2. Create `extension/manifest.json`.
3. Add background/service worker storage module.
4. Add Desktop capture content script.
5. Add localhost bridge injection.
6. Add popup UI for capture and current-tab profile selection.
7. Add options UI for profiles and optional origin defaults.
8. Add local verification fixtures or tests.

## Manual Chrome Loading

1. Build the extension.
2. Open Chrome extensions page.
3. Enable Developer Mode.
4. Choose "Load unpacked".
5. Select `extension/dist`.
6. Pin the extension action for quick access.

## Profile Capture Verification

1. Open a real Sealos Desktop page.
2. Log in normally.
3. Click the extension popup.
4. Capture the current profile.
   - Current implementation status: the background `bridge.captureCurrentTab` API exists.
   - Popup capture controls are added in a later UI milestone.
   - Until the UI control exists, this flow is verified through tests and background API inspection rather than a normal click path.
5. Confirm the resolved profile summary shows:
   - Desktop origin
   - region UID
   - workspace or nsid
   - user name
   - captured timestamp

Do not continue if the captured profile does not clearly identify the environment.

## Local App Verification

1. Start a Sealos provider app locally, for example on `http://localhost:3000`.
2. Open the local page directly in a new tab.
3. Open the extension popup on that tab.
4. Choose the intended captured profile for the current tab.
5. Reload the tab when prompted.
6. Verify the app does not show the standalone-use redirect or modal.
7. In browser devtools, confirm SDK calls receive successful responses.
8. Confirm provider API requests include the expected session-derived authorization header.
9. Switch the current tab to another profile, reload, and confirm behavior follows the new profile.
10. Disable the extension and reload to confirm normal standalone failure behavior returns.

## Multi-cluster Verification

1. Capture at least two profiles from different Sealos environments.
2. Open `http://localhost:3000`.
3. Use the popup to select the first profile for the current tab, then reload.
4. Confirm the page receives the first environment identity.
5. Use the popup to switch the same tab to the second profile, then reload.
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
- Confirm the popup displays the effective profile for the current tab.

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
