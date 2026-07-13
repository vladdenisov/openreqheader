import { clearContextMenu, createContextMenu, updateContextMenu } from './context-menu.js';
import { setLockedTabId, setPaused } from './storage-loader.js';

const PAUSE_MENU_ID = 'pause';
const LOCK_MENU_ID = 'lock';
const BROWSER_ACTION_CONTEXT = ['action'];

const currentSettings = {};

export const __testing__ = {
  PAUSE_MENU_ID,
  LOCK_MENU_ID,
  currentSettings
};

export async function initContextMenu() {
  await clearContextMenu();
  await createContextMenu({
    id: PAUSE_MENU_ID,
    title: 'Pause',
    contexts: BROWSER_ACTION_CONTEXT
  });
  await createContextMenu({
    id: LOCK_MENU_ID,
    title: 'Lock',
    contexts: BROWSER_ACTION_CONTEXT
  });
}

async function updateContextMenuIfNeeded(id, { title, onclick }) {
  if (currentSettings[id] === title) {
    return;
  }
  currentSettings[id] = title;
  await updateContextMenu(id, {
    title,
    contexts: BROWSER_ACTION_CONTEXT,
    onclick
  });
}

export async function resetContextMenu(chromeLocal) {
  if (chromeLocal.isPaused) {
    await updateContextMenuIfNeeded(PAUSE_MENU_ID, {
      title: 'Unpause OpenReqHeader',
      onclick: () => setPaused(false)
    });
  } else {
    await updateContextMenuIfNeeded(PAUSE_MENU_ID, {
      title: 'Pause OpenReqHeader',
      onclick: () => setPaused(true)
    });
  }
  if (chromeLocal.lockedTabId) {
    await updateContextMenuIfNeeded(LOCK_MENU_ID, {
      title: 'Unlock all tabs',
      onclick: () => setLockedTabId(undefined)
    });
  } else {
    await updateContextMenuIfNeeded(LOCK_MENU_ID, {
      title: 'Lock to this tab',
      onclick: () => setLockedTabId(chromeLocal.activeTabId)
    });
  }
}
