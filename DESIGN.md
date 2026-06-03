---
name: Sealos App Dev Bridge
description: A precise developer bridge for running Sealos Desktop apps from localhost with switchable environment profiles.
colors:
  surface: "#f7f8f8"
  surface-raised: "#eef3f1"
  surface-muted: "#e3ebe7"
  text: "#18201d"
  text-muted: "#596760"
  border: "#c6d0cb"
  primary: "#0f7f68"
  primary-hover: "#0b6856"
  warning: "#9a6518"
  danger: "#a43d3d"
  success: "#28775a"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "0"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0"
  mono:
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "7px 10px"
---

# Design System: Sealos App Dev Bridge

## 1. Overview

**Creative North Star: "The Cluster Switchboard"**

This is a developer tool, not a branded destination. The interface should feel like a compact control surface beside a browser tab: direct, readable, and calm under pressure. It should use native browser-extension ergonomics, small but legible type, predictable controls, and explicit state labels.

The visual system rejects decorative dashboards, large hero panels, and vague status copy. Its job is to let a Sealos developer know exactly which profile is active, where the session came from, and what local page will receive it.

**Key Characteristics:**

- Dense but not cramped.
- Native-feeling controls over custom novelty.
- Environment identity and profile source shown as data, not decoration.
- Status states use text plus color.
- Motion is restrained and tied to state changes.

## 2. Colors

The palette is a restrained neutral system with a single Sealos-leaning green accent for active connection and primary action.

### Primary

- **Bridge Green** (#0f7f68): Primary action, current tab profile indicator, selected origin default.
- **Bridge Green Hover** (#0b6856): Hover and active state for primary controls.

### Neutral

- **Mist Surface** (#f7f8f8): Default popup and options-page background.
- **Raised Surface** (#eef3f1): Toolbars, selected rows, and grouped settings.
- **Muted Surface** (#e3ebe7): Disabled controls, subtle separators, and inline metadata blocks.
- **Ink Text** (#18201d): Primary text.
- **Muted Ink** (#596760): Secondary labels and non-critical metadata.
- **Soft Border** (#c6d0cb): Dividers, input borders, and inactive control outlines.

### Status

- **Warning Amber** (#9a6518): Expired, stale, or unverified profile.
- **Danger Red** (#a43d3d): Missing session, unsafe origin, unsupported operation.
- **Success Green** (#28775a): Captured, active, or verified state.

### Named Rules

**The One Active Color Rule.** Only the currently selected tab profile or active origin default gets the primary accent. Inactive profiles stay neutral.

## 3. Typography

**Display Font:** system sans stack  
**Body Font:** system sans stack  
**Label/Mono Font:** SF Mono fallback stack for origins, ports, region IDs, and namespaces

**Character:** Typography should feel native to Chrome and macOS. The hierarchy is compact: profile names are prominent, but metadata remains scannable without turning into a dashboard.

### Hierarchy

- **Title** (650, 16px, 1.3): Popup header, active profile name, options page section titles.
- **Body** (400, 14px, 1.45): Settings copy, field labels, state explanations.
- **Label** (600, 12px, 1.25): Status labels, section captions, button text.
- **Mono** (400, 12px, 1.35): `localhost:3000`, `regionUID`, `desktopOrigin`, workspace IDs, message API names.

### Named Rules

**The Metadata Is Data Rule.** Origins, ports, IDs, and API names use monospace and must never be hidden behind prose.

## 4. Elevation

Use tonal layering before shadows. Browser extension popups are small surfaces; heavy depth makes them feel less native. Shadows are reserved for transient menus or popovers and should remain subtle.

### Shadow Vocabulary

- **Menu Lift** (`0 8px 24px rgba(24, 32, 29, 0.14)`): Dropdown menus and confirmation popovers only.

### Named Rules

**The Flat-By-Default Rule.** Static sections are separated by background and border, not floating-card shadows.

## 5. Components

### Buttons

- **Shape:** Compact rounded rectangle (6px).
- **Primary:** Bridge Green background with Mist Surface text, used for capture, use-for-this-tab, reload, and save actions.
- **Hover / Focus:** Slightly darker green on hover; focus uses a visible 2px outline outside the control.
- **Secondary:** Neutral surface with border for refresh, clear, and inspect actions.

### Profile Selector

- **Style:** Native select or listbox behavior with active profile highlighted.
- **Content:** The select label shows only the human-readable profile name, usually the captured user. The compact details block below it shows Desktop origin, region, workspace/nsid, and captured time for confirmation.
- **State:** Expired or stale profiles show warning text and an amber status marker.

### Current Tab Profile

- **Style:** Compact current-tab panel in the popup.
- **Content:** Local origin in monospace, selected profile name, profile source, and reload-needed state.
- **State:** Missing selection shows a clear choose-profile action. A changed selection shows a reload action before claiming the page is using it.

### Origin Default Row

- **Style:** One row per optional local match rule.
- **Content:** Local origin or port in monospace, assigned profile name, last used timestamp, and enable toggle.
- **State:** Disabled rows are muted and must still show their assigned profile.

### Inputs / Fields

- **Style:** Neutral background, 1px border, 6px radius.
- **Focus:** Green outline with no layout shift.
- **Error / Disabled:** Error text appears inline under the field; disabled fields retain readable text contrast.

### Status Banner

- **Style:** Full-width inline band, not a modal.
- **Content:** Short state label plus one action when useful, such as "Refresh from Desktop".

## 6. Do's and Don'ts

Do show the active profile name, Desktop origin, region, workspace, and user together.

Do make the current tab profile and its source visible before the developer relies on a local page.

Do keep origin defaults visibly optional and secondary to current-tab selection.

Do prefer plain controls, clear labels, and inspectable data over branded illustration.

Do use browser-native density; this is a working tool.

Don't use gradient text, decorative glass panels, or oversized hero typography.

Don't hide kubeconfig/session state behind "connected" alone.

Don't make a port feel permanently owned by one cluster unless the developer explicitly enables that origin default.

Don't use color as the only sign of active, stale, or unsafe state.

Don't make the extension UI look like a full Sealos Desktop clone.
