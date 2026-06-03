import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const extensionDir = resolve(root, 'extension/dist');

const { chromium } = await loadPlaywright();

const server = await startFixtureServer();
const origin = `http://127.0.0.1:${server.address().port}`;

try {
  const enabled = await runWithExtension(origin);
  const disabled = await runWithoutExtension(origin);

  console.log(
    JSON.stringify(
      {
        ok: true,
        origin,
        extensionId: enabled.extensionId,
        profileId: enabled.profileId,
        assertions: {
          capture: true,
          tabSelection: true,
          popupAutoReload: enabled.loadCountAfterSelection,
          userGetInfo: enabled.results.user.success,
          language: enabled.results.language.data,
          hostConfig: enabled.results.hostConfig.data.cloud,
          quotaItems: enabled.results.quota.data.quota.length,
          unsupportedApi: enabled.results.unsupported.message,
          recentMessages: enabled.recentMessages,
          disabledStandalone: disabled
        }
      },
      null,
      2
    )
  );
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
}

async function runWithExtension(origin) {
  const { context, userDataDir } = await launchContext(true);
  try {
    const serviceWorker = await waitForServiceWorker(context);
    const extensionId = new URL(serviceWorker.url()).host;
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/options/index.html`);

    const desktopPage = await context.newPage();
    await desktopPage.goto(`${origin}/desktop.html`);

    const capture = await extensionPage.evaluate(async (desktopUrl) => {
      const tabs = await chrome.tabs.query({ url: desktopUrl });
      if (!tabs[0]?.id) throw new Error('Desktop tab not found');
      return chrome.runtime.sendMessage({
        type: 'bridge.captureCurrentTab',
        tabId: tabs[0].id,
        trustOrigin: true
      });
    }, `${origin}/desktop.html`);

    assertOk(capture, 'capture profile');
    const profileId = capture.data.profile.id;

    const popupPage = await context.newPage();
    await popupPage.setViewportSize({ width: 356, height: 600 });
    await popupPage.goto(`chrome-extension://${extensionId}/popup/index.html`);
    await popupPage.waitForSelector('#selected-profile-details');
    const selectedProfileLabel = await popupPage
      .locator('#profile-select')
      .evaluate((select) => select.options[select.selectedIndex]?.textContent ?? '');
    const originHost = new URL(origin).host;
    assert(
      selectedProfileLabel === `Smoke Ada @ ${originHost}`,
      `popup profile option should show the profile name and Desktop host: ${selectedProfileLabel}`
    );
    assert(
      !selectedProfileLabel.includes('smoke-region') && !selectedProfileLabel.includes(profileId),
      `popup profile option should not show region UID or profile id: ${selectedProfileLabel}`
    );
    const selectedProfileDetails = await popupPage.locator('#selected-profile-details').innerText();
    assert(
      selectedProfileDetails.includes(origin),
      `popup selected profile details should show Desktop origin: ${selectedProfileDetails}`
    );
    assert(
      selectedProfileDetails.includes('smoke-region'),
      `popup selected profile details should show region: ${selectedProfileDetails}`
    );
    assert(
      selectedProfileDetails.includes('workspace-smoke'),
      `popup selected profile details should show workspace/nsid: ${selectedProfileDetails}`
    );
    assert(
      selectedProfileDetails.includes('Smoke Ada'),
      `popup selected profile details should show user: ${selectedProfileDetails}`
    );
    const popupMetrics = await popupPage.evaluate(() => {
      const shell = document.querySelector('.popup-shell');
      if (!(shell instanceof HTMLElement)) throw new Error('Popup shell missing');
      return {
        shellHeight: Math.ceil(shell.getBoundingClientRect().height),
        viewportHeight: window.innerHeight
      };
    });
    assert(
      popupMetrics.shellHeight <= popupMetrics.viewportHeight,
      `popup should fit without vertical scrolling: ${JSON.stringify(popupMetrics)}`
    );
    await popupPage.close();

    const appPage = await context.newPage();
    const consoleMessages = [];
    appPage.on('console', (message) => {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    });
    await appPage.goto(`${origin}/local-app.html`);
    const localLoadCountBeforeSelection = await appPage.evaluate(() => window.__localAppLoadCount);
    await appPage.bringToFront();
    const actionPopupPage = await openPopupPage(context, extensionPage, extensionId);
    await actionPopupPage.setViewportSize({ width: 356, height: 600 });
    await actionPopupPage.selectOption('#profile-select', profileId);
    await Promise.all([
      appPage.waitForFunction(
        (previousCount) => window.__localAppLoadCount > previousCount,
        localLoadCountBeforeSelection
      ),
      actionPopupPage.locator('#use-profile').click()
    ]);
    const localLoadCountAfterSelection = await appPage.evaluate(() => window.__localAppLoadCount);
    assert(
      localLoadCountAfterSelection === localLoadCountBeforeSelection + 1,
      `Use For This Tab should reload the local app once: before=${localLoadCountBeforeSelection}, after=${localLoadCountAfterSelection}`
    );

    const results = await sendSdkSmokeMessages(appPage);
    const bridgeMessages = await appPage.evaluate(() => window.__bridgeMessages);
    assert(
      results.user.success === true,
      `user.getInfo should succeed: ${JSON.stringify({
        user: results.user,
        bridgeMessages,
        consoleMessages: consoleMessages.slice(-20)
      })}`
    );
    assert(results.user.data.kubeconfig === 'smoke-kubeconfig', 'user.getInfo should include kubeconfig');
    assert(results.language.data.lng === 'zh', 'getLanguage should return captured language');
    assert(
      results.hostConfig.data.cloud.regionUid === 'smoke-region',
      'getHostConfig should use SDK regionUid casing'
    );
    assert(Array.isArray(results.quota.data.quota), 'quota fallback should be an array');
    assert(
      results.unsupported.message === 'function is not declare',
      'unsupported SDK API should match Desktop wording'
    );

    const state = await extensionPage.evaluate(async () =>
      chrome.runtime.sendMessage({ type: 'bridge.getState' })
    );
    assertOk(state, 'read bridge state');
    assert(state.data.recentMessages.length >= 5, 'recent SDK logs should be recorded');

    return {
      extensionId,
      profileId,
      results,
      recentMessages: state.data.recentMessages.length,
      loadCountAfterSelection: localLoadCountAfterSelection
    };
  } finally {
    await context.close();
    await rm(userDataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
}

async function runWithoutExtension(origin) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  try {
    const appPage = await context.newPage();
    await appPage.goto(`${origin}/local-app.html`);
    const result = await appPage.evaluate(() => sendSdkMessage('user.getInfo', {}, 800));
    assert(
      result.apiName === 'user.getInfo' && result.success === false,
      `standalone page should receive its own SDK request as a failed reply: ${JSON.stringify(result)}`
    );
    return result;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function launchContext(withExtension) {
  const userDataDir = await mkdtemp(join(tmpdir(), 'sealos-bridge-extension-smoke-'));
  const args = ['--window-position=2400,80', '--window-size=1200,900'];
  if (withExtension) {
    args.push(`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`);
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args
  });

  return {
    context,
    userDataDir
  };
}

async function waitForServiceWorker(context) {
  for (let index = 0; index < 80; index += 1) {
    const worker = context.serviceWorkers().find((item) =>
      item.url().endsWith('/assets/background.js')
    );
    if (worker) return worker;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Extension service worker did not start');
}

async function openPopupPage(context, extensionPage, extensionId) {
  const popupPromise = context.waitForEvent('page');
  await extensionPage.evaluate(
    (popupUrl) =>
      chrome.tabs.create({
        url: popupUrl,
        active: false
      }),
    `chrome-extension://${extensionId}/popup/index.html`
  );
  const popupPage = await popupPromise;
  await popupPage.waitForSelector('#use-profile');
  return popupPage;
}

async function sendSdkSmokeMessages(page) {
  return page.evaluate(async () => ({
    user: await sendSdkMessage('user.getInfo', {}, 10000),
    language: await sendSdkMessage('getLanguage', {}, 10000),
    hostConfig: await sendSdkMessage('getHostConfig', {}, 10000),
    quota: await sendSdkMessage('account.getWorkspaceQuota', {}, 10000),
    unsupported: await sendSdkMessage('unknown.api', {}, 10000)
  }));
}

async function startFixtureServer() {
  const sessionText = JSON.stringify({
    state: {
      session: {
        token: 'smoke-token',
        kubeconfig: 'smoke-kubeconfig',
        subscription: {
          type: 'PAYG'
        },
        user: {
          userId: 'user-smoke',
          name: 'Smoke Ada',
          avatar: '',
          k8s_username: 'ns-smoke',
          nsid: 'workspace-smoke'
        }
      }
    }
  });

  const server = http.createServer((request, response) => {
    if (request.url === '/api/platform/getCloudConfig') {
      sendJson(response, {
        data: {
          domain: 'smoke.example.test',
          port: '443',
          regionUID: 'smoke-region',
          proxyDomain: 'proxy.smoke.example.test'
        }
      });
      return;
    }

    if (request.url === '/desktop.html') {
      sendHtml(
        response,
        `<!doctype html>
<title>Fake Sealos Desktop</title>
<script>
  localStorage.setItem('session', ${JSON.stringify(sessionText)});
  document.cookie = 'NEXT_LOCALE=zh; path=/';
</script>
<h1>Fake Desktop</h1>`
      );
      return;
    }

    if (request.url === '/local-app.html') {
    sendHtml(
        response,
      `<!doctype html>
<title>Local App</title>
<script>
  window.__localAppLoadCount = Number(sessionStorage.getItem('localAppLoadCount') || '0') + 1;
  sessionStorage.setItem('localAppLoadCount', String(window.__localAppLoadCount));
  window.__bridgeMessages = [];
  window.__sdkCallbacks = new Map();
  window.addEventListener('message', (event) => {
    const message = event.data || {};
    window.__bridgeMessages.push(message);
    if (!message.messageId) return;
    if (Object.prototype.hasOwnProperty.call(message, 'apiName')) return;
    if (!window.__sdkCallbacks.has(message.messageId)) return;
    const callback = window.__sdkCallbacks.get(message.messageId);
    window.__sdkCallbacks.delete(message.messageId);
    callback(message);
  });
  window.sendSdkMessage = function sendSdkMessage(apiName, data = {}, timeout = 3000) {
    const messageId = apiName + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        window.__sdkCallbacks.delete(messageId);
        resolve({ messageId, apiName, success: false, message: 'timeout' });
      }, timeout);
      window.__sdkCallbacks.set(messageId, (message) => {
        clearTimeout(timer);
        resolve(message);
      });
      window.top.postMessage({ messageId, apiName, data, clientLocation: window.location.href }, '*');
    });
  };
</script>
<h1>Local App</h1>`
      );
      return;
    }

    response.writeHead(404);
    response.end('not found');
  });

  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  return server;
}

function sendHtml(response, body) {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(body);
}

function sendJson(response, body) {
  response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function assertOk(response, label) {
  assert(response?.ok === true, `${label} failed: ${JSON.stringify(response)}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch (error) {
    throw new Error(
      `Playwright is required for npm run smoke:extension. Run npm install first. ${error instanceof Error ? error.message : ''}`
    );
  }
}
