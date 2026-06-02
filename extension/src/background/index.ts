import { BRIDGE_VERSION, EXTENSION_NAME } from '../shared/constants';
import type { BridgeRequest } from '../shared/api';
import { handleBridgeRequest } from './messages';

chrome.runtime.onInstalled.addListener(() => {
  console.info(`${EXTENSION_NAME} ${BRIDGE_VERSION} installed`);
});

chrome.runtime.onMessage.addListener(
  (message: BridgeRequest, sender: chrome.runtime.MessageSender, sendResponse) => {
    void handleBridgeRequest(message, sender).then(sendResponse);
    return true;
  }
);
