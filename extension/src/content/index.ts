import type { BridgeResponse } from '../shared/api';
import type { PageToContentMessage, ContentToPageMessage } from '../shared/bridge-channel';
import { CHANNEL_SOURCE } from '../shared/bridge-channel';
import { BRIDGE_VERSION } from '../shared/constants';
import type { SdkReplyMessage } from '../shared/sdk';

window.postMessage(
  {
    source: CHANNEL_SOURCE,
    type: 'content-ready',
    version: BRIDGE_VERSION
  },
  window.location.origin
);

window.addEventListener('message', (event: MessageEvent<PageToContentMessage>) => {
  if (event.source !== window) return;
  if (event.origin !== window.location.origin) return;
  const message = event.data;
  if (message?.source !== CHANNEL_SOURCE || message.type !== 'sdk-request') return;

  void chrome.runtime
    .sendMessage({
      type: 'bridge.handleSdkRequest',
      localOrigin: message.localOrigin,
      request: message.request
    })
    .then((response: BridgeResponse<{ reply: SdkReplyMessage }>) => {
      const reply =
        response.ok === true
          ? response.data.reply
          : {
              masterOrigin: CHANNEL_SOURCE,
              messageId: message.request.messageId,
              success: false,
              message: response.error.message,
              data: {}
            };

      const responseMessage: ContentToPageMessage = {
        source: CHANNEL_SOURCE,
        type: 'sdk-response',
        requestId: message.requestId,
        reply
      };
      window.postMessage(responseMessage, window.location.origin);
    });
});
