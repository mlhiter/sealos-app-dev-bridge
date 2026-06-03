import type { BridgeRequest, BridgeResponse, PublicBridgeState } from './api';
import { isLocalDevelopmentOrigin } from './origin';
import type { EffectiveProfileResolution, ProfileSummary } from './types';

export type ActiveTabInfo =
  | {
      ok: true;
      tab: chrome.tabs.Tab;
      tabId: number;
      origin: string;
      isLocal: boolean;
    }
  | {
      ok: false;
      message: string;
    };

export async function sendBridgeMessage<T>(message: BridgeRequest): Promise<BridgeResponse<T>> {
  return chrome.runtime.sendMessage(message);
}

export async function loadBridgeState(): Promise<PublicBridgeState> {
  const response = await sendBridgeMessage<PublicBridgeState>({
    type: 'bridge.getState'
  });
  if (!response.ok) throw new Error(response.error.message);
  return response.data;
}

export async function getActiveTabInfo(): Promise<ActiveTabInfo> {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  if (!tab?.id || !tab.url) {
    return {
      ok: false,
      message: 'No active tab'
    };
  }

  let origin: string;
  try {
    origin = new URL(tab.url).origin;
  } catch {
    return {
      ok: false,
      message: 'Unsupported tab URL'
    };
  }

  return {
    ok: true,
    tab,
    tabId: tab.id,
    origin,
    isLocal: isLocalDevelopmentOrigin(origin)
  };
}

export async function resolveCurrentTabProfile(
  tabInfo: Extract<ActiveTabInfo, { ok: true }>
): Promise<EffectiveProfileResolution> {
  const response = await sendBridgeMessage<EffectiveProfileResolution>({
    type: 'bridge.resolveProfile',
    tabId: tabInfo.tabId,
    localOrigin: tabInfo.origin
  });
  if (!response.ok) throw new Error(response.error.message);
  return response.data;
}

export function formatProfileLabel(profile: ProfileSummary) {
  const name = profile.user.name || profile.name;
  const originHost = getOriginHost(profile.desktopOrigin);
  return originHost ? `${name} @ ${originHost}` : name;
}

export function formatProfileMeta(profile: ProfileSummary) {
  return `${profile.desktopOrigin} · ${profile.user.nsid} · ${profile.user.name}`;
}

export function getProfileDetailRows(profile: ProfileSummary) {
  return [
    ['Desktop origin', profile.desktopOrigin],
    ['Region', profile.cloud.regionUID],
    ['Workspace / nsid', profile.user.nsid],
    ['Captured', new Date(profile.capturedAt).toLocaleString()]
  ] as const;
}

export function formatResolution(resolution: EffectiveProfileResolution) {
  if (resolution.source === 'none') return resolution.error;
  return `${resolution.source}: ${formatProfileLabel(resolution.profile)}`;
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getOriginHost(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return '';
  }
}
