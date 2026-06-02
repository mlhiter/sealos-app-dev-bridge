import type { DesktopCapturePayload } from './types';

export async function collectDesktopCapturePayloadInPage(): Promise<DesktopCapturePayload> {
  function getCookieValue(name: string) {
    const encodedName = `${encodeURIComponent(name)}=`;
    const entry = document.cookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(encodedName));
    if (!entry) return undefined;
    return decodeURIComponent(entry.slice(encodedName.length));
  }

  async function fetchCloudConfig(): Promise<DesktopCapturePayload['cloud']> {
    try {
      const response = await fetch('/api/platform/getCloudConfig', {
        credentials: 'same-origin'
      });
      if (!response.ok) return undefined;

      const json = (await response.json()) as {
        data?: DesktopCapturePayload['cloud'];
      };
      return json.data;
    } catch {
      return undefined;
    }
  }

  const desktopOrigin = window.location.origin;
  const sessionText = window.localStorage.getItem('session');
  const language = getCookieValue('NEXT_LOCALE') ?? window.navigator.language?.split('-')[0] ?? 'en';
  const cloud = await fetchCloudConfig();

  return {
    desktopOrigin,
    sessionText,
    language,
    cloud
  };
}
