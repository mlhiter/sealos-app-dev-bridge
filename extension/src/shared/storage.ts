import type { PublicBridgeState } from './api';
import { toProfileSummary } from './profile';
import type { BridgeProfile, BridgeState } from './types';

export const STORAGE_KEY = 'sealosAppDevBridgeState';

export type StorageArea = {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

export function createDefaultState(now: string = new Date().toISOString()): BridgeState {
  return {
    schemaVersion: 1,
    profiles: {},
    tabSelections: {},
    originDefaults: {},
    recentMessages: [],
    settings: {
      allowedDesktopOrigins: [],
      allowedLocalOrigins: []
    },
    updatedAt: now
  };
}

export async function readState(storage: StorageArea): Promise<BridgeState> {
  const values = await storage.get(STORAGE_KEY);
  const candidate = values[STORAGE_KEY];
  const migrated = migrateState(candidate);
  if (!migrated) {
    return createDefaultState();
  }
  return migrated;
}

export async function writeState(storage: StorageArea, state: BridgeState): Promise<void> {
  await storage.set({
    [STORAGE_KEY]: state
  });
}

export async function updateState(
  storage: StorageArea,
  updater: (state: BridgeState) => BridgeState | Promise<BridgeState>
): Promise<BridgeState> {
  const current = await readState(storage);
  const next = await updater(current);
  await writeState(storage, next);
  return next;
}

export function upsertProfile(
  state: BridgeState,
  profile: BridgeProfile,
  now: string = new Date().toISOString()
): BridgeState {
  return {
    ...state,
    profiles: {
      ...state.profiles,
      [profile.id]: {
        ...profile,
        lastUsedAt: now
      }
    },
    activeProfileId: profile.id,
    updatedAt: now
  };
}

export function toPublicState(state: BridgeState): PublicBridgeState {
  return {
    profiles: Object.values(state.profiles)
      .map(toProfileSummary)
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)),
    tabSelections: state.tabSelections,
    originDefaults: Object.values(state.originDefaults).sort((a, b) =>
      a.localOrigin.localeCompare(b.localOrigin)
    ),
    activeProfileId: state.activeProfileId,
    allowedDesktopOrigins: state.settings.allowedDesktopOrigins,
    allowedLocalOrigins: state.settings.allowedLocalOrigins,
    recentMessages: state.recentMessages
  };
}

export function createChromeStorageArea(area: chrome.storage.StorageArea): StorageArea {
  return {
    get(key) {
      return new Promise((resolve) => {
        area.get(key, (items) => resolve(items));
      });
    },
    set(items) {
      return new Promise((resolve) => {
        area.set(items, () => resolve());
      });
    }
  };
}

function migrateState(value: unknown): BridgeState | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const state = value as BridgeState;
  const baseIsValid =
    state.schemaVersion === 1 &&
    isRecord(state.profiles) &&
    isRecord(state.tabSelections) &&
    isRecord(state.originDefaults) &&
    Boolean(state.settings) &&
    Array.isArray(state.settings.allowedDesktopOrigins) &&
    Array.isArray(state.settings.allowedLocalOrigins);

  if (!baseIsValid) return undefined;

  return {
    ...state,
    recentMessages: Array.isArray(state.recentMessages) ? state.recentMessages : []
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
