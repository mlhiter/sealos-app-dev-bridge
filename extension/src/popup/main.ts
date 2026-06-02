import type { BridgeRequest, BridgeResponse } from '../shared/api';
import { isLocalDevelopmentOrigin } from '../shared/origin';
import type { EffectiveProfileResolution } from '../shared/types';

const originNode = document.querySelector<HTMLElement>('#current-origin');
const profileSourceNode = document.querySelector<HTMLElement>('#profile-source');

async function renderCurrentTab() {
  if (!originNode) return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.url) {
    originNode.textContent = 'No active tab';
    setProfileSource('No profile resolved');
    return;
  }

  let origin: string;
  try {
    origin = new URL(tab.url).origin;
  } catch {
    originNode.textContent = tab.url;
    setProfileSource('Unsupported tab URL');
    return;
  }

  originNode.textContent = origin;
  if (!isLocalDevelopmentOrigin(origin)) {
    setProfileSource('Open a localhost app tab to resolve a profile');
    return;
  }

  const response = await sendBridgeMessage<EffectiveProfileResolution>({
    type: 'bridge.resolveProfile',
    tabId: tab.id,
    localOrigin: origin
  });

  if (!response.ok) {
    setProfileSource(response.error.message);
    return;
  }

  setProfileSource(
    response.data.source === 'none'
      ? response.data.error
      : `${response.data.source}: ${response.data.profile.name}`
  );
}

function setProfileSource(value: string) {
  if (profileSourceNode) {
    profileSourceNode.textContent = value;
  }
}

async function sendBridgeMessage<T>(message: BridgeRequest): Promise<BridgeResponse<T>> {
  return chrome.runtime.sendMessage(message);
}

void renderCurrentTab();
