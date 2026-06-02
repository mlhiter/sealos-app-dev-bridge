# Architecture

## Purpose

Sealos App Dev Bridge simulates the small portion of Sealos Desktop that local provider apps need during development: the `sealos-desktop-sdk` master message contract.

It does not replace Sealos Desktop, create App CRs, or mutate cluster resources. It captures authenticated context from real Desktop pages and replays that context to explicitly allowed localhost pages.

## System Components

```text
Real Sealos Desktop tab
  localStorage.session
        |
        | capture
        v
Chrome extension background
  chrome.storage.local profiles
        |
        | current tab selection / remembered origin default
        v
Local provider page on localhost
  injected SDK master bridge
        |
        | SDK response
        v
Provider app runtime
  existing request interceptors and APIs
```

## Profile Model

A profile represents one captured Sealos environment.

Recommended fields:

```ts
type BridgeProfile = {
  id: string;
  name: string;
  desktopOrigin: string;
  capturedAt: string;
  lastUsedAt?: string;
  cloud: {
    domain: string;
    port: string;
    regionUID: string;
    proxyDomain?: string;
  };
  session: {
    user: {
      id: string;
      name: string;
      avatar: string;
      k8sUsername: string;
      nsid: string;
    };
    subscription: unknown;
    token?: string;
    kubeconfig: string;
  };
  language: string;
};
```

The preferred unique identity is:

```text
desktopOrigin + regionUID + session.user.nsid
```

If future evidence shows `nsid` is insufficient for workspace identity across clusters, include workspace UID or namespace from the captured session/kubeconfig.

Current-tab selections and origin defaults should be stored separately from the profile payload so one captured profile does not "own" a local port.

```ts
type BridgeSelectionState = {
  tabSelections: Record<
    number,
    {
      localOrigin: string;
      profileId: string;
      selectedAt: string;
    }
  >;
  originDefaults: Array<{
    localOrigin: string;
    profileId: string;
    enabled: boolean;
    updatedAt: string;
  }>;
  activeProfileId?: string;
};
```

## Message Bridge

Provider apps call `window.top.postMessage(...)` through `sealos-desktop-sdk`. In a normal Desktop iframe, `window.top` is Desktop. In a standalone `localhost` tab, `window.top === window`, so the bridge must run early enough to answer or intercept the SDK message before the app treats its own message as a failed response.

Implementation implications:

- Inject at `document_start`.
- Inject into the page main world, not only the extension isolated world.
- Validate that the current local origin is allowed.
- Resolve the correct profile before answering.
- Reply with the same `messageId` shape the SDK expects.

SDK APIs to support:

| API | Response |
| --- | --- |
| `user.getInfo` | Current profile `SessionV1` |
| `getLanguage` | `{ lng }` |
| `getHostConfig` | `{ cloud, features }` |
| `account.getWorkspaceQuota` | Quota list, empty or fetched strategy in MVP |
| `event-bus` | Local fallback for app events |

## Profile Resolution

Profile selection must be deterministic:

1. Current tab profile selection from the popup.
2. Remembered profile for the current local origin, including optional origin or port defaults.
3. Active global profile fallback.
4. No profile, return an explicit error that asks the user to choose in the popup.

This keeps the normal workflow tab-first: the same `http://localhost:3000` page can use staging in one debugging session and a test cluster in the next. Origin defaults are convenience automation for stable workflows, not the primary model.

Changing the selected profile for a tab should prompt a reload in the MVP. Provider apps usually initialize their SDK session early, so hot-swapping a profile after app startup risks mixed old/new runtime state.

## Storage Boundary

The default storage is `chrome.storage.local`. Captured session data must not leave the browser extension. Avoid syncing profiles through `chrome.storage.sync` because session material may exceed sync quotas and should not move across browsers by default.

The extension stores full `BridgeProfile` records internally, but UI/debug APIs expose only redacted `ProfileSummary` values. `ProfileSummary` may indicate whether token or kubeconfig data exists, but it must not include token or kubeconfig strings.

## Background API

The background service worker accepts typed extension messages:

| Message | Purpose |
| --- | --- |
| `bridge.captureCurrentTab` | Capture `localStorage.session` and cloud config from a trusted Desktop tab |
| `bridge.getState` | Return redacted profile state for UI surfaces |
| `bridge.selectTabProfile` | Select a profile for the current tab and local origin |
| `bridge.clearTabProfile` | Clear the current tab override |
| `bridge.rememberOriginDefault` | Add or update an optional local-origin default |
| `bridge.setActiveProfile` | Set or clear the active fallback profile |
| `bridge.resolveProfile` | Resolve the effective profile for a local tab |

## Security Boundaries

- Only configured Desktop origins may be captured.
- Only configured local development origins may receive bridge injection.
- No remote telemetry should include session data, kubeconfig, app token, or profile payload.
- The bridge should expose debug state locally, but redact long secrets by default.

## Failure Modes

| Failure | Expected behavior |
| --- | --- |
| No captured profile | SDK call returns a clear no-profile error |
| Profile stale or expired | Popup warns and offers refresh from Desktop |
| Local origin not allowed | No injection or explicit unsafe-origin error |
| Local tab has no selected profile | Popup asks the user to choose a captured profile and reload |
| User switches cluster for the same port | New tab selection overrides remembered origin/default state after reload |
| Unsupported event bus action | Return success with no-op only if safe, otherwise explain unsupported action |
| Extension disabled | Provider app returns to normal standalone behavior |

## Rollback

Rollback is simple: disable or remove the extension. Since the default design does not write cluster or database state, rollback does not require cleanup in Sealos.
