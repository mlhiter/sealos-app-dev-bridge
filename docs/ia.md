# Information Architecture

## Surfaces

Sealos App Dev Bridge has three expected user-facing surfaces:

1. Popup
2. Options page
3. Local debug overlay or debug panel

The MVP ships popup and options surfaces. The popup handles normal daily workflow; options handles inspection and bulk state visibility.

## Popup

Primary job: answer "what profile is this local tab using right now?" and let the developer choose a cluster for that tab.

Suggested layout:

```text
Header
  current tab profile selector
  status badge

Current Tab
  origin
  profile source

Selected Profile
  select label with profile name and Desktop host
  selected profile details visible under the selector
  Desktop origin
  region UID
  workspace / nsid
  captured time

Actions
  Capture current Desktop tab
  Use selected profile for this tab and reload
  Refresh profile
  Open details

Effective Profile
  hidden on non-local tabs
  actual profile source for the current localhost tab
  Desktop origin
  region UID
  workspace / nsid
  user
  captured time
```

## Options Page

Primary job: manage many captured clusters and optional automatic local-origin defaults.

Sections:

- Profiles
  - list, rename, delete, refresh
  - show Desktop origin, region UID, workspace, user, last captured
- Origin Defaults
  - local origin or port
  - assigned profile
  - enabled toggle
  - presented as optional origin defaults, not required setup
- Allowed origins
  - Desktop origins allowed for capture
  - local origins allowed for injection
- Debug
  - storage export without secrets
  - clear all profiles
  - recent SDK message log with metadata only

## Debug Overlay Or Panel

Optional but useful after MVP.

Primary job: explain why a local page did or did not receive profile context.

Fields:

- injection status
- selected profile
- profile source: tab selection, remembered origin, active fallback, or none
- last SDK message
- last response
- redacted session summary
- errors

Debug message logs should show API names, success state, and error text only. They must not show `user.getInfo` response payloads, token, or kubeconfig.

Current implementation status: the options page shows profile summaries, optional origin defaults, and metadata-only SDK message logs. It does not yet expose destructive profile deletion or storage export.

## Navigation Principles

- Keep capture and active profile switching in the popup.
- Keep "use for this tab" in the popup as the primary path.
- Keep optional origin defaults, destructive actions, and bulk default management in the options page or behind confirmation.
- Never require users to inspect raw storage for normal workflows.
- Do not use modals as the first interaction path.

## Content Rules

- Use exact origin and port text, for example `http://localhost:3000`.
- Use exact region UID and Desktop origin.
- Label stale and unsafe states with text, not only color.
- Keep messages short enough to fit the popup without wrapping unpredictably.
- Distinguish temporary tab selection from remembered origin defaults in copy and status labels.
