window.postMessage(
  {
    source: 'sealos-app-dev-bridge',
    type: 'capture-script-ready'
  },
  window.location.origin
);
