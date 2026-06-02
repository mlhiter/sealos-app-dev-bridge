import type { BridgeRequest, BridgeResponse } from '../shared/api';
import { isLocalDevelopmentOrigin, normalizeOrigin } from '../shared/origin';
import { createOriginDefault, createTabSelection, resolveEffectiveProfile } from '../shared/profile';
import { createProfileFromCapture } from '../shared/session';
import {
  createChromeStorageArea,
  readState,
  toPublicState,
  updateState,
  upsertProfile
} from '../shared/storage';
import type { BridgeState, DesktopCapturePayload } from '../shared/types';
import { collectDesktopCapturePayloadInPage } from './capture';

export async function handleBridgeRequest(
  message: BridgeRequest,
  sender: chrome.runtime.MessageSender
): Promise<BridgeResponse<unknown>> {
  const storage = createChromeStorageArea(chrome.storage.local);

  try {
    switch (message.type) {
      case 'bridge.captureCurrentTab':
        return ok(await captureCurrentTab(storage, message));
      case 'bridge.getState':
        return ok(toPublicState(await readState(storage)));
      case 'bridge.selectTabProfile':
        return ok(await selectTabProfile(storage, message));
      case 'bridge.clearTabProfile':
        return ok(await clearTabProfile(storage, message.tabId));
      case 'bridge.rememberOriginDefault':
        return ok(await rememberOriginDefault(storage, message));
      case 'bridge.setActiveProfile':
        return ok(await setActiveProfile(storage, message.profileId));
      case 'bridge.resolveProfile':
        return ok(await resolveProfileForRequest(storage, message, sender));
      default:
        return fail('unknown-message', 'Unknown bridge message');
    }
  } catch (error) {
    return fail('bridge-error', error instanceof Error ? error.message : 'Bridge request failed');
  }
}

async function captureCurrentTab(
  storage: ReturnType<typeof createChromeStorageArea>,
  request: Extract<BridgeRequest, { type: 'bridge.captureCurrentTab' }>
) {
  const tab = await getTargetTab(request.tabId);
  if (!tab.id || !tab.url) {
    throw new Error('No active tab is available for capture');
  }

  const desktopOrigin = normalizeOrigin(tab.url);
  const state = await readState(storage);
  const isTrusted = state.settings.allowedDesktopOrigins.includes(desktopOrigin);
  if (!isTrusted && request.trustOrigin !== true) {
    throw new Error(`Desktop origin is not trusted yet: ${desktopOrigin}`);
  }

  const payload = await executeCaptureScript(tab.id);
  const profile = createProfileFromCapture(
    {
      ...payload,
      desktopOrigin
    },
    new Date().toISOString()
  );

  let trustedOriginAdded = false;
  const next = await updateState(storage, (current) => {
    const updated = upsertProfile(current, profile);
    if (!updated.settings.allowedDesktopOrigins.includes(desktopOrigin)) {
      trustedOriginAdded = true;
      updated.settings = {
        ...updated.settings,
        allowedDesktopOrigins: [...updated.settings.allowedDesktopOrigins, desktopOrigin]
      };
    }
    return updated;
  });

  return {
    profile: toPublicState(next).profiles.find((item) => item.id === profile.id)!,
    trustedOriginAdded
  };
}

async function selectTabProfile(
  storage: ReturnType<typeof createChromeStorageArea>,
  request: Extract<BridgeRequest, { type: 'bridge.selectTabProfile' }>
) {
  const localOrigin = normalizeOrigin(request.localOrigin);
  const next = await updateState(storage, (state) => {
    assertProfileExists(state, request.profileId);
    return {
      ...state,
      tabSelections: {
        ...state.tabSelections,
        [String(request.tabId)]: createTabSelection({
          tabId: request.tabId,
          localOrigin,
          profileId: request.profileId,
          selectedAt: new Date().toISOString()
        })
      },
      updatedAt: new Date().toISOString()
    };
  });

  return resolveEffectiveProfile(next, {
    tabId: request.tabId,
    localOrigin
  });
}

async function clearTabProfile(
  storage: ReturnType<typeof createChromeStorageArea>,
  tabId: number
) {
  const next = await updateState(storage, (state) => {
    const tabSelections = { ...state.tabSelections };
    delete tabSelections[String(tabId)];
    return {
      ...state,
      tabSelections,
      updatedAt: new Date().toISOString()
    };
  });

  return toPublicState(next);
}

async function rememberOriginDefault(
  storage: ReturnType<typeof createChromeStorageArea>,
  request: Extract<BridgeRequest, { type: 'bridge.rememberOriginDefault' }>
) {
  const localOrigin = normalizeOrigin(request.localOrigin);
  const originDefault = createOriginDefault({
    localOrigin,
    profileId: request.profileId,
    enabled: request.enabled,
    updatedAt: new Date().toISOString()
  });

  await updateState(storage, (state) => {
    assertProfileExists(state, request.profileId);
    if (!isLocalDevelopmentOrigin(localOrigin, state.settings.allowedLocalOrigins)) {
      throw new Error(`Local origin is not allowed: ${localOrigin}`);
    }

    return {
      ...state,
      originDefaults: {
        ...state.originDefaults,
        [localOrigin]: originDefault
      },
      updatedAt: new Date().toISOString()
    };
  });

  return originDefault;
}

async function setActiveProfile(
  storage: ReturnType<typeof createChromeStorageArea>,
  profileId: string | undefined
) {
  const next = await updateState(storage, (state) => {
    if (profileId) {
      assertProfileExists(state, profileId);
    }
    return {
      ...state,
      activeProfileId: profileId,
      updatedAt: new Date().toISOString()
    };
  });

  return toPublicState(next);
}

async function resolveProfileForRequest(
  storage: ReturnType<typeof createChromeStorageArea>,
  request: Extract<BridgeRequest, { type: 'bridge.resolveProfile' }>,
  sender: chrome.runtime.MessageSender
) {
  const state = await readState(storage);
  const localOrigin = normalizeOrigin(request.localOrigin);
  if (!isLocalDevelopmentOrigin(localOrigin, state.settings.allowedLocalOrigins)) {
    throw new Error(`Local origin is not allowed: ${localOrigin}`);
  }

  return resolveEffectiveProfile(state, {
    tabId: request.tabId ?? sender.tab?.id,
    localOrigin
  });
}

async function executeCaptureScript(tabId: number): Promise<DesktopCapturePayload> {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: collectDesktopCapturePayloadInPage
  });
  const payload = results[0]?.result;
  if (!payload) {
    throw new Error('Capture script did not return Desktop session data');
  }
  return payload;
}

async function getTargetTab(tabId: number | undefined) {
  if (typeof tabId === 'number') {
    return chrome.tabs.get(tabId);
  }

  const [activeTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });
  return activeTab;
}

function assertProfileExists(state: BridgeState, profileId: string) {
  if (!state.profiles[profileId]) {
    throw new Error(`Unknown profile: ${profileId}`);
  }
}

function ok<T>(data: T): BridgeResponse<T> {
  return {
    ok: true,
    data
  };
}

function fail(code: string, message: string): BridgeResponse<never> {
  return {
    ok: false,
    error: {
      code,
      message
    }
  };
}
