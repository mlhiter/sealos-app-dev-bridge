# Product

## Register

product

## Users

Sealos frontend developers who build and debug Desktop apps locally. They often run a provider app on `localhost:3000` or a neighboring port while authenticated against one of many online, staging, or test Sealos clusters. Their context is fast iteration: HMR, direct tabs, browser devtools, and minimal cluster setup ceremony.

Secondary users are Sealos platform maintainers who need the tool to preserve authentication boundaries, avoid accidental cluster mutations, and make it obvious which cluster/workspace is active.

## Product Purpose

Sealos App Dev Bridge removes the need to create a Sealos App CR that points at localhost for every local development session. It gives local app pages the same `sealos-desktop-sdk` master responses they would receive inside Sealos Desktop, so providers can initialize session, language, host config, quota, and app event flows while running in a standalone browser tab.

Success means a developer can log into a real Sealos Desktop once, capture one or more environment profiles, open `localhost` app pages directly, choose the cluster profile for the current tab from the extension popup, and continue using the app's existing request/session code without provider-specific patches. Developers may optionally remember a profile for a local origin or port, but permanent port binding is not the default path.

## Brand Personality

Quiet, precise, infrastructure-aware.

The product should feel like a trustworthy developer utility: compact, inspectable, and explicit about current state. It should not feel like a consumer extension, a marketing surface, or a magic auth bypass.

## Anti-references

- A one-off token paste box that encourages copying kubeconfigs into random fields.
- A browser extension UI that hides the active cluster or workspace behind ambiguous labels.
- A fake Desktop clone with decorative chrome that slows normal localhost development.
- A hard port-to-cluster mapping that makes `localhost:3000` feel owned by one environment.
- Automatic cloud resource mutation as the default path.
- Generic "modern SaaS" panels with large empty cards and vague helper copy.

## Design Principles

1. Make the active environment impossible to miss.
   Every local page should have a clear, inspectable mapping to a captured Sealos profile: environment, region, workspace, user, and source Desktop origin.

2. Simulate the Desktop SDK contract, not Sealos itself.
   The bridge should answer the existing `sealos-desktop-sdk` message protocol. It should not reinvent app auth, fork provider code, or become a hidden backend.

3. Keep cluster state read-only by default.
   Capturing session context and answering SDK messages is allowed. Creating App CRs, modifying Kubernetes resources, or writing databases is out of scope unless explicitly added later.

4. Optimize for multi-cluster reality.
   Online, staging, and test clusters are first-class. Current-tab profile switching, optional origin defaults, and profile inspection belong in the MVP, not as polish.

5. Fail loudly and reversibly.
   Missing session, expired profile, origin mismatch, and unsupported SDK event flows should produce clear local feedback. Disabling or uninstalling the extension should restore the normal provider behavior.

## Accessibility & Inclusion

The extension UI should target WCAG 2.2 AA. It should work with keyboard navigation, expose focus states, avoid color-only status indicators, support reduced motion, and keep profile identity readable for color-blind users.
