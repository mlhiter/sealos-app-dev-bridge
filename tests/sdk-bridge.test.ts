import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createProfileFromCapture } from '../extension/src/shared/session';
import { handleSdkRequest, isSdkRequestMessage, SDK_API } from '../extension/src/shared/sdk';

describe('SDK bridge responder', () => {
  it('answers user.getInfo with the selected profile session', () => {
    const profile = createTestProfile();
    const result = handleSdkRequest({
      request: {
        messageId: 'message-1',
        apiName: SDK_API.USER_GET_INFO
      },
      profile,
      now: '2026-06-02T09:00:00.000Z'
    });

    assert.equal(result.handled, true);
    assert.equal(result.reply.success, true);
    assert.equal(result.reply.messageId, 'message-1');
    assert.deepEqual(result.reply.data.user, profile.session.user);
    assert.equal(result.reply.data.kubeconfig, 'kubeconfig-value');
  });

  it('answers getHostConfig using SDK regionUid casing', () => {
    const profile = createTestProfile();
    const result = handleSdkRequest({
      request: {
        messageId: 'message-2',
        apiName: SDK_API.GET_HOST_CONFIG
      },
      profile
    });

    assert.equal(result.handled, true);
    assert.deepEqual(result.reply.data, {
      cloud: {
        domain: 'cloud.example.test',
        port: '443',
        regionUid: 'test-region'
      },
      features: {
        subscription: true
      }
    });
  });

  it('answers language and quota fallback', () => {
    const profile = createTestProfile();
    const language = handleSdkRequest({
      request: {
        messageId: 'message-3',
        apiName: SDK_API.GET_LANGUAGE
      },
      profile
    });
    const quota = handleSdkRequest({
      request: {
        messageId: 'message-4',
        apiName: SDK_API.GET_WORKSPACE_QUOTA
      },
      profile
    });

    assert.equal(language.handled, true);
    assert.deepEqual(language.reply.data, { lng: 'zh' });
    assert.equal(quota.handled, true);
    assert.equal(Array.isArray(quota.reply.data.quota), true);
  });

  it('answers getLanguage with the effective tab language', () => {
    const profile = {
      ...createTestProfile(),
      language: 'en'
    };
    const language = handleSdkRequest({
      request: {
        messageId: 'message-language-override',
        apiName: SDK_API.GET_LANGUAGE
      },
      profile
    });

    assert.equal(language.handled, true);
    assert.deepEqual(language.reply.data, { lng: 'en' });
  });

  it('returns safe event-bus fallback and rejects unknown events', () => {
    const profile = createTestProfile();
    const safe = handleSdkRequest({
      request: {
        messageId: 'message-5',
        apiName: SDK_API.EVENT_BUS,
        data: {
          eventName: 'openDesktopApp'
        }
      },
      profile
    });
    const unsafe = handleSdkRequest({
      request: {
        messageId: 'message-6',
        apiName: SDK_API.EVENT_BUS,
        data: {
          eventName: 'doSomethingRisky'
        }
      },
      profile
    });

    assert.equal(safe.handled, true);
    assert.equal(safe.reply.success, true);
    assert.equal(unsafe.handled, true);
    assert.equal(unsafe.reply.success, false);
    assert.match(unsafe.reply.message, /Unsupported local event-bus action/);
  });

  it('returns explicit no-profile and unsupported-function errors', () => {
    const noProfile = handleSdkRequest({
      request: {
        messageId: 'message-7',
        apiName: SDK_API.USER_GET_INFO
      }
    });
    const unsupported = handleSdkRequest({
      request: {
        messageId: 'message-8',
        apiName: 'unknown.api'
      },
      profile: createTestProfile()
    });

    assert.equal(noProfile.handled, true);
    assert.equal(noProfile.reply.success, false);
    assert.match(noProfile.reply.message, /No profile selected/);
    assert.equal(unsupported.handled, true);
    assert.equal(unsupported.reply.success, false);
    assert.equal(unsupported.reply.message, 'function is not declare');
  });

  it('recognizes SDK-shaped messages only', () => {
    assert.equal(isSdkRequestMessage({ messageId: 'id', apiName: 'user.getInfo' }), true);
    assert.equal(isSdkRequestMessage({ messageId: 'id', apiName: 'random.page.message' }), true);
    assert.equal(isSdkRequestMessage({ messageId: '', apiName: 'user.getInfo' }), false);
    assert.equal(isSdkRequestMessage({ messageId: 'id', apiName: '' }), false);
    assert.equal(isSdkRequestMessage({ messageId: 'id' }), false);
    assert.equal(isSdkRequestMessage(null), false);
  });
});

function createTestProfile() {
  return createProfileFromCapture(
    {
      desktopOrigin: 'https://cloud.example.test',
      sessionText: JSON.stringify({
        state: {
          session: {
            token: 'jwt-token',
            kubeconfig: 'kubeconfig-value',
            subscription: {
              type: 'PAYG'
            },
            user: {
              userId: 'user-1',
              name: 'Ada',
              avatar: '',
              k8s_username: 'ns-ada',
              nsid: 'workspace-1'
            }
          }
        }
      }),
      language: 'zh',
      cloud: {
        domain: 'cloud.example.test',
        port: '443',
        regionUID: 'test-region'
      },
      features: {
        subscription: true
      }
    },
    '2026-06-02T09:00:00.000Z'
  );
}
