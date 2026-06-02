import type { SdkReplyMessage, SdkRequestMessage } from './sdk';

export const CHANNEL_SOURCE = 'sealos-app-dev-bridge';

export type PageToContentMessage = {
  source: typeof CHANNEL_SOURCE;
  type: 'sdk-request';
  requestId: string;
  request: SdkRequestMessage;
  localOrigin: string;
};

export type ContentToPageMessage = {
  source: typeof CHANNEL_SOURCE;
  type: 'sdk-response';
  requestId: string;
  reply: SdkReplyMessage;
};

export function createRequestId(messageId: string): string {
  return `${Date.now().toString(36)}-${messageId}`;
}
