import { BRIDGE_VERSION } from '../shared/constants';

window.postMessage(
  {
    source: 'sealos-app-dev-bridge',
    type: 'content-ready',
    version: BRIDGE_VERSION
  },
  window.location.origin
);
