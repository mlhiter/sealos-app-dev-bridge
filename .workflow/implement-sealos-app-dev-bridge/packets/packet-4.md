# Packet 4: Popup, Options, Docs, and Final Verification

Objective: complete the developer-facing extension workflow and align docs.

Context: the product's primary interaction is current-tab cluster selection in the popup. Origin defaults are optional and secondary.

Files / sources:

- `extension/src/popup/**`
- `extension/src/options/**`
- `extension/src/shared/**`
- `tests/**`
- `README.md`
- `PRODUCT.md`
- `DESIGN.md`
- `ROADMAP.md`
- `AGENTS.md`
- `docs/**`
- `.workflow/implement-sealos-app-dev-bridge/**`

Ownership: popup/options UI, debug state, manual fixture, docs, final report.

Do:

- Let users capture the current Desktop tab from the popup.
- Let users choose a profile for the current localhost tab.
- Show effective profile source: tab selection, origin default, active fallback, or none.
- Show reload-needed state after switching profile.
- Let users optionally remember a profile for the current origin.
- Redact sensitive session fields in UI and debug output.
- Update docs and workflow final report.

Do not:

- Build a marketing landing page.
- Hide exact origin, cluster, workspace, or user identity.
- Make origin defaults look mandatory.

Expected output: a buildable extension with a usable tab-first profile workflow and aligned docs.

Verification:

- `npm run typecheck`
- `npm test`
- `npm run build`
- Browser smoke test if a local target is available.
- `python3 /Users/mlhiter/.codex/skills/codex-dynamic-workflows/scripts/verify_workflow.py .workflow/implement-sealos-app-dev-bridge`
- `git diff --check`
