import { escapeHtml, formatProfileLabel, formatProfileMeta, loadBridgeState } from '../shared/ui';

const profilesNode = query('#profiles');
const defaultsNode = query('#origin-defaults');
const debugNode = query('#debug-log');
const refreshButton = query<HTMLButtonElement>('#refresh');

async function render() {
  const state = await loadBridgeState();
  profilesNode.innerHTML =
    state.profiles.length === 0
      ? '<p class="empty">No profiles captured.</p>'
      : state.profiles
          .map(
            (profile) => `
              <article class="row">
                <div>
                  <strong>${escapeHtml(formatProfileLabel(profile))}</strong>
                  <span>${escapeHtml(formatProfileMeta(profile))}</span>
                  <span>Captured ${escapeHtml(new Date(profile.capturedAt).toLocaleString())}</span>
                </div>
                <span class="status">${profile.hasKubeconfig ? 'Session' : 'No session'}</span>
              </article>
            `
          )
          .join('');

  defaultsNode.innerHTML =
    state.originDefaults.length === 0
      ? '<p class="empty">No optional origin defaults.</p>'
      : state.originDefaults
          .map((item) => {
            const profile = state.profiles.find((candidate) => candidate.id === item.profileId);
            return `
              <article class="row">
                <div>
                  <strong>${escapeHtml(item.localOrigin)}</strong>
                  <span>${escapeHtml(profile ? formatProfileLabel(profile) : item.profileId)}</span>
                  <span>Updated ${escapeHtml(new Date(item.updatedAt).toLocaleString())}</span>
                </div>
                <span class="status">${item.enabled ? 'Enabled' : 'Disabled'}</span>
              </article>
            `;
          })
          .join('');

  debugNode.innerHTML =
    state.recentMessages.length === 0
      ? '<p class="empty">No SDK messages recorded.</p>'
      : state.recentMessages
          .map(
            (item) => `
              <article class="row">
                <div>
                  <strong>${escapeHtml(item.apiName)}</strong>
                  <span>${escapeHtml(item.messageId)}</span>
                  <span>${escapeHtml(new Date(item.at).toLocaleString())}</span>
                  <span>${escapeHtml(item.message || 'ok')}</span>
                </div>
                <span class="status">${item.success ? 'OK' : 'Error'}</span>
              </article>
            `
          )
          .join('');
}

function query<T extends HTMLElement = HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) {
    throw new Error(`Missing options node: ${selector}`);
  }
  return node;
}

refreshButton.addEventListener('click', () => void render());

void render();
