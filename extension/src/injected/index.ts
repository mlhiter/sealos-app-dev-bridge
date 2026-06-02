import type { ContentToPageMessage, PageToContentMessage } from '../shared/bridge-channel';
import { CHANNEL_SOURCE, createRequestId } from '../shared/bridge-channel';
import { isSdkRequestMessage } from '../shared/sdk';

const pendingRequests = new Set<string>();

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return;
  if (event.origin !== window.location.origin) return;

  const data = event.data;
  if (data?.source === CHANNEL_SOURCE) {
    if (data.type === 'sdk-response') {
      handleSdkResponse(data);
    }
    return;
  }

  if (!isSdkRequestMessage(data)) return;

  const requestId = createRequestId(data.messageId);
  pendingRequests.add(requestId);
  const message: PageToContentMessage = {
    source: CHANNEL_SOURCE,
    type: 'sdk-request',
    requestId,
    request: data,
    localOrigin: window.location.origin
  };

  window.postMessage(message, window.location.origin);
});

window.postMessage(
  {
    source: CHANNEL_SOURCE,
    type: 'injected-ready'
  },
  window.location.origin
);

function handleSdkResponse(message: ContentToPageMessage) {
  if (!pendingRequests.has(message.requestId)) return;
  pendingRequests.delete(message.requestId);
  window.postMessage(message.reply, window.location.origin);
}
