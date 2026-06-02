import { collectDesktopCapturePayloadInPage } from '../shared/capture-page';

void collectDesktopCapturePayloadInPage().then((payload) => {
  window.postMessage(
    {
      source: 'sealos-app-dev-bridge',
      type: 'desktop-capture-result',
      payload
    },
    window.location.origin
  );
});
