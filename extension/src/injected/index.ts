window.postMessage(
  {
    source: 'sealos-app-dev-bridge',
    type: 'injected-ready'
  },
  window.location.origin
);
