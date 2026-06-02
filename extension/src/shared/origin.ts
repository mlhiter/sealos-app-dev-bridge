export function toOrigin(value: string): string | undefined {
  const direct = parseHttpOrigin(value);
  if (direct) return direct;

  try {
    return parseHttpOrigin(`http://${value}`);
  } catch {
    return undefined;
  }
}

function parseHttpOrigin(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.origin === 'null') return undefined;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export function normalizeOrigin(value: string): string {
  const origin = toOrigin(value);
  if (!origin) {
    throw new Error(`Invalid origin: ${value}`);
  }
  return origin;
}

export function isLocalDevelopmentOrigin(origin: string, additionalAllowedOrigins: string[] = []) {
  const normalized = toOrigin(origin);
  if (!normalized) return false;
  if (additionalAllowedOrigins.includes(normalized)) return true;

  const url = new URL(normalized);
  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  );
}

export function getDefaultPort(protocol: string) {
  if (protocol === 'https:') return '443';
  if (protocol === 'http:') return '80';
  return '';
}
