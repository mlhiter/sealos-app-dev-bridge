import type { BridgeProfile, HostConfig, SessionV1, WorkspaceQuotaItem } from './types';

export const SDK_API = {
  USER_GET_INFO: 'user.getInfo',
  EVENT_BUS: 'event-bus',
  GET_LANGUAGE: 'getLanguage',
  GET_WORKSPACE_QUOTA: 'account.getWorkspaceQuota',
  GET_HOST_CONFIG: 'getHostConfig'
} as const;

export type SdkApiName = (typeof SDK_API)[keyof typeof SDK_API];

export type SdkRequestMessage = {
  messageId: string;
  apiName: string;
  data?: Record<string, unknown>;
  clientLocation?: string;
};

export type SdkReplyMessage = {
  masterOrigin: string;
  messageId: string;
  success: boolean;
  message: string;
  data: Record<string, unknown>;
};

export type SdkBridgeResult =
  | {
      handled: true;
      reply: SdkReplyMessage;
      log: SdkMessageLogEntry;
    }
  | {
      handled: false;
    };

export type SdkMessageLogEntry = {
  messageId: string;
  apiName: string;
  success: boolean;
  message: string;
  at: string;
};

export function isSdkRequestMessage(value: unknown): value is SdkRequestMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as SdkRequestMessage;
  return (
    typeof message.messageId === 'string' &&
    message.messageId.trim() !== '' &&
    typeof message.apiName === 'string' &&
    message.apiName.trim() !== ''
  );
}

export function createSdkReply(input: {
  messageId: string;
  success: boolean;
  data?: Record<string, unknown>;
  message?: string;
  masterOrigin?: string;
}): SdkReplyMessage {
  return {
    masterOrigin: input.masterOrigin ?? 'sealos-app-dev-bridge',
    messageId: input.messageId,
    success: input.success,
    message: input.message ?? '',
    data: input.data ?? {}
  };
}

export function handleSdkRequest(input: {
  request: SdkRequestMessage;
  profile?: BridgeProfile;
  now?: string;
}): SdkBridgeResult {
  const { request, profile } = input;
  if (!isSupportedSdkApi(request.apiName)) {
    return {
      handled: true,
      reply: createSdkReply({
        messageId: request.messageId,
        success: false,
        message: 'function is not declare'
      }),
      log: createLog(request, false, 'function is not declare', input.now)
    };
  }

  if (!profile) {
    return {
      handled: true,
      reply: createSdkReply({
        messageId: request.messageId,
        success: false,
        message: 'No profile selected for this local tab'
      }),
      log: createLog(request, false, 'No profile selected for this local tab', input.now)
    };
  }

  switch (request.apiName) {
    case SDK_API.USER_GET_INFO:
      return successResult(request, sessionToRecord(profile.session), input.now);
    case SDK_API.GET_LANGUAGE:
      return successResult(request, { lng: profile.language }, input.now);
    case SDK_API.GET_HOST_CONFIG:
      return successResult(request, hostConfigToRecord(profile.hostConfig), input.now);
    case SDK_API.GET_WORKSPACE_QUOTA:
      return successResult(request, { quota: createQuotaFallback() }, input.now);
    case SDK_API.EVENT_BUS:
      return handleEventBus(request, input.now);
    default:
      return {
        handled: false
      };
  }
}

export function isSupportedSdkApi(apiName: string): apiName is SdkApiName {
  return Object.values(SDK_API).includes(apiName as SdkApiName);
}

function handleEventBus(request: SdkRequestMessage, now?: string): SdkBridgeResult {
  const eventName = typeof request.data?.eventName === 'string' ? request.data.eventName : '';
  const safeNoopEvents = new Set(['openDesktopApp', 'closeDesktopApp', 'requestLogin', 'quitGuide']);

  if (safeNoopEvents.has(eventName)) {
    return successResult(
      request,
      {
        handledLocally: true,
        eventName
      },
      now
    );
  }

  return {
    handled: true,
    reply: createSdkReply({
      messageId: request.messageId,
      success: false,
      message: eventName ? `Unsupported local event-bus action: ${eventName}` : 'Unsupported event-bus action'
    }),
    log: createLog(
      request,
      false,
      eventName ? `Unsupported local event-bus action: ${eventName}` : 'Unsupported event-bus action',
      now
    )
  };
}

function successResult(
  request: SdkRequestMessage,
  data: Record<string, unknown>,
  now?: string
): Extract<SdkBridgeResult, { handled: true }> {
  return {
    handled: true,
    reply: createSdkReply({
      messageId: request.messageId,
      success: true,
      data
    }),
    log: createLog(request, true, '', now)
  };
}

function createLog(
  request: SdkRequestMessage,
  success: boolean,
  message: string,
  now: string = new Date().toISOString()
): SdkMessageLogEntry {
  return {
    messageId: request.messageId,
    apiName: request.apiName,
    success,
    message,
    at: now
  };
}

function sessionToRecord(session: SessionV1): Record<string, unknown> {
  return {
    token: session.token,
    user: session.user,
    subscription: session.subscription,
    kubeconfig: session.kubeconfig
  };
}

function hostConfigToRecord(hostConfig: HostConfig): Record<string, unknown> {
  return {
    cloud: hostConfig.cloud,
    features: hostConfig.features
  };
}

function createQuotaFallback(): WorkspaceQuotaItem[] {
  return [
    { type: 'cpu', used: 0, limit: 0 },
    { type: 'memory', used: 0, limit: 0 },
    { type: 'storage', used: 0, limit: 0 },
    { type: 'gpu', used: 0, limit: 0 },
    { type: 'traffic', used: 0, limit: 0 },
    { type: 'nodeport', used: 0, limit: 0 }
  ];
}
