# References

## Sealos Code References

These paths describe the source behavior this project bridges. Re-check them against the current Sealos branch before implementation.

- `/Users/mlhiter/labring/sealos/frontend/packages/client-sdk/src/app.ts`
  - App-side SDK sends messages to `window.top`.
  - Key methods include `getSession`, `getLanguage`, `getWorkspaceQuota`, `getHostConfig`, and `runEvents`.
- `/Users/mlhiter/labring/sealos/frontend/packages/client-sdk/src/master.ts`
  - Desktop-side SDK reads `localStorage.session`, normalizes it, and replies to app messages.
- `/Users/mlhiter/labring/sealos/frontend/desktop/src/components/desktop_content/index.tsx`
  - Desktop creates the master app and registers event bus handlers.
- `/Users/mlhiter/labring/sealos/frontend/providers/devbox/app/[lang]/(platform)/layout.tsx`
  - DevBox initializes through `createSealosApp()` and `sealosApp.getSession()`.
- `/Users/mlhiter/labring/sealos/frontend/providers/devbox/services/request.ts`
  - DevBox request interceptor sends session-derived authorization headers.
- `/Users/mlhiter/labring/sealos/frontend/providers/dbprovider/src/pages/_app.tsx`
  - DBProvider follows the same app initialization pattern.
- `/Users/mlhiter/labring/sealos/frontend/providers/applaunchpad/src/pages/_app.tsx`
  - AppLaunchpad follows the same app initialization pattern.
- `/Users/mlhiter/labring/sealos/frontend/providers/objectstorage/src/pages/_app.tsx`
  - ObjectStorage follows the same app initialization pattern.
- `/Users/mlhiter/labring/sealos/frontend/providers/aiproxy/components/InitializeApp.tsx`
  - AIProxy initializes session and language through the SDK.

## Chrome Extension References

- Chrome Extensions documentation: `developer.chrome.com/docs/extensions`
- Manifest V3 content scripts:
  - `run_at: "document_start"` controls early injection.
  - `world: "MAIN"` allows injected code to share the page JavaScript environment.
  - Default isolated-world content scripts cannot directly patch page runtime objects.
- Manifest V3 storage:
  - `chrome.storage.local` is the expected persistence layer for profile data.
  - Service workers should not rely on global variables for durable state.

## Product References

- Browser devtools and Raycast-like utility density for compact task UI.
- Sealos Desktop SDK as the protocol source of truth.
- Existing Sealos provider apps as compatibility targets, not sources to fork.

## Terms

**Desktop origin**  
The real Sealos Desktop URL where session context is captured.

**Local origin**  
The local development page receiving bridge injection, such as `http://localhost:3000`.

**Profile**  
Captured environment context plus metadata and local matching rules.

**Current tab selection**  
The profile chosen from the popup for the active localhost tab. This is the default way to switch the same local port between clusters.

**Bridge**  
The injected responder for `sealos-desktop-sdk` app messages.

**Origin default**  
An optional remembered rule that assigns a local origin or port to a profile for stable repeated workflows.
