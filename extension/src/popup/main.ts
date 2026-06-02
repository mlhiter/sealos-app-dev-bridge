const originNode = document.querySelector<HTMLElement>('#current-origin');

async function renderCurrentTab() {
  if (!originNode) return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.url) {
    originNode.textContent = 'No active tab';
    return;
  }

  try {
    originNode.textContent = new URL(tab.url).origin;
  } catch {
    originNode.textContent = tab.url;
  }
}

void renderCurrentTab();
