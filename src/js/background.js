import { setLocal } from './storage.js';
import { resetBrowserActions } from './browser-action-manager.js';
import { applyDnrRules } from './dnr-rules.js';
import { loadProfilesFromStorage } from './worker-data-manager.js';
import { onMessageReceived } from './message-handler.js';
import { onCommandReceived } from './command-handler.js';
import { addTabUpdatedListener } from './tabs.js';
import { initContextMenu, resetContextMenu } from './context-menu-manager.js';

let chromeLocal = {
  isPaused: true
};
let selectedActiveProfile;
let activeProfiles = [];

async function onTabUpdated(tab) {
  await setLocal({ activeTabId: tab.id });
  await resetBrowserActions({ chromeLocal, activeProfiles, selectedActiveProfile });
  await resetContextMenu(chromeLocal);
}

async function initialize() {
  addTabUpdatedListener(onTabUpdated);
  await initContextMenu();
  // Sign-in detection listener disconnected along with URL_BASE (see
  // identity.js / README) - there is no login URL to watch for anymore.
  await loadProfilesFromStorage(async (params) => {
    chromeLocal = params.chromeLocal;
    activeProfiles = params.activeProfiles;
    selectedActiveProfile = params.selectedActiveProfile;
    await applyDnrRules({ chromeLocal, activeProfiles });
    await resetBrowserActions({ chromeLocal, activeProfiles, selectedActiveProfile });
    await resetContextMenu(chromeLocal);
  });
}

chrome.runtime.onMessageExternal.addListener(async function (request, sender, sendResponse) {
  // Disconnected from modheader.com (see README): no external origin is
  // trusted here anymore, so external messages are always rejected.
  if (!process.env.URL_BASE || !sender.origin.startsWith(process.env.URL_BASE)) {
    sendResponse({ error: 'Unsupported origin' });
    return;
  }
  if (await onMessageReceived({ chromeLocal, request })) {
    sendResponse({ success: true });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  await onCommandReceived(chromeLocal, command);
});

// Top-level await is disallowed in extension service workers (unlike plain
// module workers), so this can't be awaited here.
initialize().catch(console.error);
