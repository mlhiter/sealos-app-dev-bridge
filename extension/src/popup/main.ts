import type { PublicBridgeState } from '../shared/api';
import type { EffectiveProfileResolution, ProfileSummary } from '../shared/types';
import {
  escapeHtml,
  formatProfileLabel,
  formatResolution,
  getProfileDetailRows,
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
const selectedProfileDetailsNode = query('#selected-profile-details');
const useProfileButton = query<HTMLButtonElement>('#use-profile');
const captureButton = query<HTMLButtonElement>('#capture-profile');
const captureNoteNode = query('#capture-note');

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
    profileSourceNode.className = 'meta-line state-muted';
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

  renderSelectedProfileDetails();
}

function renderTab(tab: Awaited<ReturnType<typeof getActiveTabInfo>>) {
  if (!tab.ok) {
    originNode.textContent = tab.message;
    tabKindNode.textContent = 'No Tab';
    tabKindNode.className = 'status-pill is-danger';
    originNode.className = 'tab-origin state-muted';
    return;
  }

  originNode.textContent = tab.origin;
  originNode.className = `tab-origin ${tab.isLocal ? 'state-ready' : ''}`;
  tabKindNode.textContent = tab.isLocal ? 'Local App' : 'Source Tab';
  tabKindNode.className = `status-pill ${tab.isLocal ? 'is-local' : 'is-source'}`;
}

function renderResolution(nextResolution: EffectiveProfileResolution) {
  profileSourceNode.textContent = formatResolution(nextResolution);
  profileSourceNode.className = `meta-line ${
    nextResolution.source === 'none' ? 'state-danger' : 'state-ready'
  }`;
  if (nextResolution.source === 'none') {
    return;
  }

  const profile = nextResolution.profile;
  profileSelect.value = profile.id;
  renderSelectedProfileDetails();
}

function renderSelectedProfileDetails() {
  const profile = state?.profiles.find((candidate) => candidate.id === profileSelect.value);
  if (!profile) {
    selectedProfileDetailsNode.className = 'profile-detail-block is-empty';
    selectedProfileDetailsNode.textContent = state?.profiles.length
      ? 'Choose a captured profile to inspect its Desktop origin, region, and workspace.'
      : 'No captured profiles yet.';
    return;
  }

  selectedProfileDetailsNode.className = 'profile-detail-block';
  selectedProfileDetailsNode.innerHTML = `
    <div class="profile-summary">
      <strong>${escapeHtml(formatProfileLabel(profile))}</strong>
      <span>${profile.hasKubeconfig ? 'Session ready' : 'Session incomplete'}</span>
    </div>
    <dl class="profile-detail-list">
      ${getProfileDetailRows(profile)
        .map(
          ([label, value]) => `
            <div>
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(value)}</dd>
            </div>
          `
        )
        .join('')}
    </dl>
  `;
}

function syncControlState() {
  const hasProfiles = Boolean(state?.profiles.length);
  const isLocalTab = activeTab?.ok === true && activeTab.isLocal;
  const selectedProfile = Boolean(profileSelect.value);

  useProfileButton.disabled = !hasProfiles || !isLocalTab || !selectedProfile;
  captureButton.disabled = activeTab?.ok !== true || isLocalTab;
  if (activeTab?.ok === true && isLocalTab) {
    captureNoteNode.textContent = 'Switch to an authenticated Sealos Desktop tab to capture a profile.';
  } else if (activeTab?.ok === true) {
    captureNoteNode.textContent = 'Capture only from a real authenticated Sealos Desktop page.';
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
  setStatus('Profile selected, reloading');
  await chrome.tabs.reload(activeTab.tabId);
  window.close();
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
captureButton.addEventListener('click', () => void captureCurrentTab());
profileSelect.addEventListener('change', () => {
  renderSelectedProfileDetails();
  syncControlState();
});

void render().catch((error: unknown) => {
  setStatus(error instanceof Error ? error.message : 'Popup failed');
});
