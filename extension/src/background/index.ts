import { BRIDGE_VERSION, EXTENSION_NAME } from '../shared/constants';

chrome.runtime.onInstalled.addListener(() => {
  console.info(`${EXTENSION_NAME} ${BRIDGE_VERSION} installed`);
});
