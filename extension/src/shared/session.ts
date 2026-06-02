import { getDefaultPort, normalizeOrigin } from './origin';
import type { BridgeProfile, DesktopCapturePayload, DesktopCloudConfig, SessionV1 } from './types';

type DesktopSession = {
  token?: string;
  user?: {
    userId?: string;
    name?: string;
    avatar?: string;
    k8s_username?: string;
    nsid?: string;
  };
  subscription?: unknown;
  kubeconfig?: string;
};

export function parseDesktopSession(sessionText: string | null): SessionV1 {
  if (!sessionText) {
    throw new Error('No Desktop session found in localStorage.session');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(sessionText);
  } catch {
    throw new Error('Desktop session is not valid JSON');
  }

  const session = (parsed as { state?: { session?: DesktopSession } })?.state?.session;
  if (!session) {
    throw new Error('Desktop session is missing state.session');
  }

  if (!session.user) {
    throw new Error('Desktop session is missing user');
  }

  const userId = requiredString(session.user.userId, 'session.user.userId');
  const name = requiredString(session.user.name, 'session.user.name');
  const k8sUsername = requiredString(session.user.k8s_username, 'session.user.k8s_username');
  const nsid = requiredString(session.user.nsid, 'session.user.nsid');
  const kubeconfig = requiredString(session.kubeconfig, 'session.kubeconfig');

  return {
    token: stringOrUndefined(session.token),
    user: {
      id: userId,
      name,
      avatar: stringOrUndefined(session.user.avatar) ?? '',
      k8sUsername,
      nsid
    },
    subscription: session.subscription ?? null,
    kubeconfig
  };
}

export function createProfileFromCapture(
  capture: DesktopCapturePayload,
  now: string = new Date().toISOString()
): BridgeProfile {
  const desktopOrigin = normalizeOrigin(capture.desktopOrigin);
  const desktopUrl = new URL(desktopOrigin);
  const session = parseDesktopSession(capture.sessionText);
  const cloud = normalizeCloudConfig(capture, desktopUrl);
  const language = normalizeLanguage(capture.language);
  const id = createProfileId(desktopOrigin, cloud.regionUID, session.user.nsid);
  const name = `${cloud.regionUID || desktopUrl.hostname} / ${session.user.name}`;

  return {
    id,
    name,
    desktopOrigin,
    capturedAt: capture.capturedAt ?? now,
    cloud,
    hostConfig: {
      cloud: {
        domain: cloud.domain,
        port: cloud.port,
        regionUid: cloud.regionUID
      },
      features: {
        subscription: capture.features?.subscription === true
      }
    },
    session,
    language
  };
}

export function createProfileId(desktopOrigin: string, regionUID: string, nsid: string): string {
  return `profile-${fnv1a(`${desktopOrigin}|${regionUID}|${nsid}`)}`;
}

function normalizeCloudConfig(
  capture: DesktopCapturePayload,
  desktopUrl: URL
): DesktopCloudConfig {
  const cloud = capture.cloud ?? {};
  const protocolDefaultPort = getDefaultPort(desktopUrl.protocol);
  const regionUID = stringOrUndefined(cloud.regionUID) ?? stringOrUndefined(cloud.regionUid) ?? '';
  const port = (stringOrUndefined(cloud.port) ?? desktopUrl.port) || protocolDefaultPort;

  return {
    domain: stringOrUndefined(cloud.domain) ?? desktopUrl.hostname,
    port,
    regionUID: regionUID || 'unknown-region',
    proxyDomain: stringOrUndefined(cloud.proxyDomain) ?? stringOrUndefined(cloud.domain),
    allowedOrigins: Array.isArray(cloud.allowedOrigins)
      ? cloud.allowedOrigins.filter((origin): origin is string => typeof origin === 'string')
      : undefined
  };
}

function normalizeLanguage(language: string | undefined) {
  const normalized = stringOrUndefined(language)?.trim();
  if (!normalized) return 'en';
  return normalized;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Desktop session is missing ${field}`);
  }
  return value;
}

function stringOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function fnv1a(value: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
