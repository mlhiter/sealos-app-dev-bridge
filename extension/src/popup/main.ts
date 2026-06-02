import type { PublicBridgeState } from '../shared/api';
import type { EffectiveProfileResolution, ProfileSummary } from '../shared/types';
import {
  escapeHtml,
  formatProfileLabel,
  formatProfileMeta,
  formatResolution,
  getActiveTabInfo,
  loadBridgeState,
  resolveCurrentTabProfile,
  sendBridgeMessage
} from '../shared/ui';

const statusNode = query('#status');
const tabKindNode = query('#tab-kind');
const originNode = query('#current-origin');
const profileSourceNode = query('#profile-source');
const profileSelect = query<HTMLSelectElement>('#profile-select');
const useProfileButton = query<HTMLButtonElement>('#use-profile');
const reloadButton = query<HTMLButtonElement>('#reload-tab');
const rememberOriginButton = query<HTMLButtonElement>('#remember-origin');
const captureButton = query<HTMLButtonElement>('#capture-profile');
const captureNoteNode = query('#capture-note');
const profileSummaryNode = query('#profile-summary');
const openOptionsButton = query<HTMLButtonElement>('#open-options');

let state: PublicBridgeState | undefined;
let activeTab: Awaited<ReturnType<typeof getActiveTabInfo>> | undefined;
let resolution: EffectiveProfileResolution | undefined;

async function render() {
  setStatus('Loading');
  state = await loadBridgeState();
  activeTab = await getActiveTabInfo();

  renderProfiles(state.profiles);
  renderTab(activeTab);

  if (activeTab.ok && activeTab.isLocal) {
    resolution = await resolveCurrentTabProfile(activeTab);
    renderResolution(resolution);
  } else {
    resolution = undefined;
    profileSourceNode.textContent = activeTab.ok
      ? 'Open a localhost app tab to resolve a profile'
      : activeTab.message;
    profileSummaryNode.textContent = 'No local tab selected.';
  }

  syncControlState();
  setStatus(`${state.profiles.length} profile${state.profiles.length === 1 ? '' : 's'}`);
}

function renderProfiles(profiles: ProfileSummary[]) {
  profileSelect.innerHTML = '';
  if (profiles.length === 0) {
    profileSelect.append(new Option('No profiles captured', ''));
    return;
  }

  for (const profile of profiles) {
    profileSelect.append(new Option(formatProfileLabel(profile), profile.id));
  }

  const preferred = resolution?.source !== 'none' ? resolution?.profileId : state?.activeProfileId;
  if (preferred) {
    profileSelect.value = preferred;
  }
}

function renderTab(tab: Awaited<ReturnType<typeof getActiveTabInfo>>) {
  if (!tab.ok) {
    originNode.textContent = tab.message;
    tabKindNode.textContent = 'No Tab';
    return;
  }

  originNode.textContent = tab.origin;
  tabKindNode.textContent = tab.isLocal ? 'Local App' : 'Capture Source';
}

function renderResolution(nextResolution: EffectiveProfileResolution) {
  profileSourceNode.textContent = formatResolution(nextResolution);
  if (nextResolution.source === 'none') {
    profileSummaryNode.textContent = 'Choose a captured profile for this tab.';
    return;
  }

  const profile = nextResolution.profile;
  profileSelect.value = profile.id;
  profileSummaryNode.innerHTML = `
    <strong>${escapeHtml(profile.name)}</strong>
    <span>${escapeHtml(formatProfileMeta(profile))}</span>
    <span>Captured ${escapeHtml(new Date(profile.capturedAt).toLocaleString())}</span>
  `;
}

function syncControlState() {
  const hasProfiles = Boolean(state?.profiles.length);
  const isLocalTab = activeTab?.ok === true && activeTab.isLocal;
  const selectedProfile = Boolean(profileSelect.value);

  useProfileButton.disabled = !hasProfiles || !isLocalTab || !selectedProfile;
  rememberOriginButton.disabled = !hasProfiles || !isLocalTab || !selectedProfile;
  reloadButton.disabled = activeTab?.ok !== true;
  captureButton.disabled = activeTab?.ok !== true || isLocalTab;
  if (activeTab?.ok === true && isLocalTab) {
    captureNoteNode.textContent = 'Switch to an authenticated Sealos Desktop tab to capture a profile.';
  } else if (activeTab?.ok === true) {
    captureNoteNode.textContent = 'Capture only from an authenticated Sealos Desktop tab.';
  }
}

async function useProfileForCurrentTab() {
  if (activeTab?.ok !== true || !activeTab.isLocal || !profileSelect.value) return;
  const response = await sendBridgeMessage<EffectiveProfileResolution>({
    type: 'bridge.selectTabProfile',
    tabId: activeTab.tabId,
    localOrigin: activeTab.origin,
    profileId: profileSelect.value
  });

  if (!response.ok) {
    setStatus(response.error.message);
    return;
  }

  resolution = response.data;
  renderResolution(response.data);
  setStatus('Profile selected, reload tab');
}

async function rememberOriginDefault() {
  if (activeTab?.ok !== true || !activeTab.isLocal || !profileSelect.value) return;
  const response = await sendBridgeMessage({
    type: 'bridge.rememberOriginDefault',
    localOrigin: activeTab.origin,
    profileId: profileSelect.value,
    enabled: true
  });

  setStatus(response.ok ? 'Origin default saved' : response.error.message);
}

async function captureCurrentTab() {
  if (activeTab?.ok !== true) return;

  setStatus('Capturing');
  const response = await sendBridgeMessage<{
    profile: ProfileSummary;
    trustedOriginAdded: boolean;
  }>({
    type: 'bridge.captureCurrentTab',
    tabId: activeTab.tabId,
    trustOrigin: true
  });

  if (!response.ok) {
    captureNoteNode.textContent = response.error.message;
    setStatus('Capture failed');
    return;
  }

  captureNoteNode.textContent = response.data.trustedOriginAdded
    ? 'Profile captured and Desktop origin trusted.'
    : 'Profile refreshed.';
  await render();
}

async function reloadCurrentTab() {
  if (activeTab?.ok !== true) return;
  await chrome.tabs.reload(activeTab.tabId);
  window.close();
}

function setStatus(value: string) {
  statusNode.textContent = value;
}

function query<T extends HTMLElement = HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) {
    throw new Error(`Missing popup node: ${selector}`);
  }
  return node;
}

useProfileButton.addEventListener('click', () => void useProfileForCurrentTab());
rememberOriginButton.addEventListener('click', () => void rememberOriginDefault());
captureButton.addEventListener('click', () => void captureCurrentTab());
reloadButton.addEventListener('click', () => void reloadCurrentTab());
openOptionsButton.addEventListener('click', () => void chrome.runtime.openOptionsPage());
profileSelect.addEventListener('change', syncControlState);

void render().catch((error: unknown) => {
  setStatus(error instanceof Error ? error.message : 'Popup failed');
});
