import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createOriginDefault, createTabSelection, resolveEffectiveProfile, toProfileSummary } from '../extension/src/shared/profile';
import { normalizeOrigin } from '../extension/src/shared/origin';
import { createProfileFromCapture, parseDesktopSession } from '../extension/src/shared/session';
import { createDefaultState, readState, toPublicState, upsertProfile, writeState } from '../extension/src/shared/storage';
import type { BridgeState } from '../extension/src/shared/types';
import { formatProfileLabel } from '../extension/src/shared/ui';

describe('Desktop session normalization', () => {
  it('normalizes localStorage.session into SessionV1', () => {
    const session = parseDesktopSession(createDesktopSessionText());

    assert.deepEqual(session.user, {
      id: 'user-1',
      name: 'Ada',
      avatar: '',
      k8sUsername: 'ns-ada',
      nsid: 'workspace-1'
    });
    assert.equal(session.token, 'jwt-token');
    assert.equal(session.kubeconfig, 'kubeconfig-value');
  });

  it('throws useful errors for malformed Desktop session payloads', () => {
    assert.throws(() => parseDesktopSession(null), /No Desktop session/);
    assert.throws(() => parseDesktopSession('{'), /not valid JSON/);
    assert.throws(() => parseDesktopSession(JSON.stringify({ state: {} })), /state.session/);
  });
});

describe('origin normalization', () => {
  it('normalizes bare localhost ports without accepting custom URL schemes', () => {
    assert.equal(normalizeOrigin('localhost:3000'), 'http://localhost:3000');
    assert.equal(normalizeOrigin('127.0.0.1:3001/path'), 'http://127.0.0.1:3001');
    assert.throws(() => normalizeOrigin('javascript:alert(1)'), /Invalid origin/);
  });
});

describe('profile creation', () => {
  it('creates stable profile identity and SDK host config shape', () => {
    const profile = createProfileFromCapture(
      {
        desktopOrigin: 'https://cloud.example.test',
        sessionText: createDesktopSessionText(),
        language: 'zh',
        cloud: {
          domain: 'cloud.example.test',
          port: '443',
          regionUID: 'test-region',
          proxyDomain: 'proxy.example.test'
        },
        features: {
          subscription: true
        }
      },
      '2026-06-02T09:00:00.000Z'
    );

    assert.equal(profile.desktopOrigin, 'https://cloud.example.test');
    assert.equal(profile.cloud.regionUID, 'test-region');
    assert.equal(profile.hostConfig.cloud.regionUid, 'test-region');
    assert.equal(profile.hostConfig.features.subscription, true);
    assert.equal(profile.language, 'zh');
    assert.match(profile.id, /^profile-[0-9a-f]{8}$/);
  });

  it('formats profile labels with workspace identity before Desktop host', () => {
    const profileA = createTestProfile('test-region', 'workspace-a', 'admin');
    const profileB = createTestProfile('test-region', 'workspace-b', 'admin');

    assert.equal(formatProfileLabel(toProfileSummary(profileA)), 'workspace-a @ test-region.example.test');
    assert.equal(formatProfileLabel(toProfileSummary(profileB)), 'workspace-b @ test-region.example.test');
    assert.notEqual(formatProfileLabel(toProfileSummary(profileA)), formatProfileLabel(toProfileSummary(profileB)));
  });
});

describe('profile resolution', () => {
  it('prefers current tab selection over origin default and active profile', () => {
    const profileA = createTestProfile('region-a', 'workspace-a', 'Ada');
    const profileB = createTestProfile('region-b', 'workspace-b', 'Ben');
    const state = withProfiles(createDefaultState('2026-06-02T09:00:00.000Z'), profileA, profileB);
    state.activeProfileId = profileA.id;
    state.originDefaults['http://localhost:3000'] = createOriginDefault({
      localOrigin: 'http://localhost:3000',
      profileId: profileA.id,
      enabled: true,
      updatedAt: '2026-06-02T09:00:00.000Z'
    });
    state.tabSelections['7'] = createTabSelection({
      tabId: 7,
      localOrigin: 'http://localhost:3000',
      profileId: profileB.id,
      languageOverride: 'zh',
      selectedAt: '2026-06-02T09:01:00.000Z'
    });

    const resolved = resolveEffectiveProfile(state, {
      tabId: 7,
      localOrigin: 'http://localhost:3000'
    });

    assert.equal(resolved.source, 'tab-selection');
    assert.equal(resolved.profileId, profileB.id);
    assert.equal(resolved.profile?.user.name, 'Ben');
    assert.equal(resolved.language, 'zh');
    assert.equal(resolved.languageOverride, 'zh');
    assert.equal(profileB.language, 'en');
  });

  it('falls back from origin default to active profile and then no-profile error', () => {
    const profile = createTestProfile('region-a', 'workspace-a', 'Ada');
    const state = withProfiles(createDefaultState('2026-06-02T09:00:00.000Z'), profile);
    state.originDefaults['http://localhost:3000'] = createOriginDefault({
      localOrigin: 'http://localhost:3000',
      profileId: profile.id,
      enabled: true,
      updatedAt: '2026-06-02T09:00:00.000Z'
    });

    const originResolved = resolveEffectiveProfile(state, {
      localOrigin: 'http://localhost:3000'
    });
    assert.equal(originResolved.source, 'origin-default');
    assert.equal(originResolved.language, profile.language);

    state.originDefaults['http://localhost:3000'].enabled = false;
    state.activeProfileId = profile.id;
    const activeResolved = resolveEffectiveProfile(state, {
      localOrigin: 'http://localhost:3000'
    });
    assert.equal(activeResolved.source, 'active-profile');
    assert.equal(activeResolved.language, profile.language);

    state.activeProfileId = undefined;
    const missingResolved = resolveEffectiveProfile(state, {
      localOrigin: 'http://localhost:3000'
    });
    assert.equal(missingResolved.source, 'none');
    assert.match(missingResolved.error, /No profile selected/);
  });
});

describe('storage public state', () => {
  it('redacts session material from public profile summaries', async () => {
    const memory = createMemoryStorage();
    const profile = createTestProfile('region-a', 'workspace-a', 'Ada');
    const state = upsertProfile(createDefaultState('2026-06-02T09:00:00.000Z'), profile);
    await writeState(memory, state);

    const loaded = await readState(memory);
    const publicState = toPublicState(loaded);

    assert.equal(publicState.profiles.length, 1);
    assert.equal(publicState.profiles[0].hasKubeconfig, true);
    assert.equal('kubeconfig' in publicState.profiles[0], false);
    assert.equal('token' in publicState.profiles[0], false);
  });

  it('migrates older state without recent SDK message logs', async () => {
    const memory = createMemoryStorage();
    const profile = createTestProfile('region-a', 'workspace-a', 'Ada');
    const state = upsertProfile(createDefaultState('2026-06-02T09:00:00.000Z'), profile);
    delete (state as Partial<BridgeState>).recentMessages;
    await memory.set({
      sealosAppDevBridgeState: state
    });

    const loaded = await readState(memory);

    assert.equal(Object.keys(loaded.profiles).length, 1);
    assert.deepEqual(loaded.recentMessages, []);
  });
});

function createTestProfile(regionUID: string, nsid: string, name: string) {
  return createProfileFromCapture(
    {
      desktopOrigin: `https://${regionUID}.example.test`,
      sessionText: createDesktopSessionText({ nsid, name }),
      cloud: {
        domain: `${regionUID}.example.test`,
        port: '443',
        regionUID
      }
    },
    '2026-06-02T09:00:00.000Z'
  );
}

function withProfiles(state: BridgeState, ...profiles: ReturnType<typeof createTestProfile>[]) {
  for (const profile of profiles) {
    state.profiles[profile.id] = profile;
  }
  return state;
}

function createDesktopSessionText(overrides: { nsid?: string; name?: string } = {}) {
  return JSON.stringify({
    state: {
      session: {
        token: 'jwt-token',
        kubeconfig: 'kubeconfig-value',
        subscription: {
          type: 'PAYG'
        },
        user: {
          userId: 'user-1',
          name: overrides.name ?? 'Ada',
          avatar: '',
          k8s_username: 'ns-ada',
          nsid: overrides.nsid ?? 'workspace-1'
        }
      }
    }
  });
}

function createMemoryStorage() {
  const memory: Record<string, unknown> = {};
  return {
    async get(key: string) {
      return {
        [key]: memory[key]
      };
    },
    async set(items: Record<string, unknown>) {
      Object.assign(memory, items);
    }
  };
}
