// ShellAPI — formal seam between the React Luna shell and embedded app runtime.
// React registers shell handlers; embedded scripts register lifecycle/dialog handlers.

const SHELL_API_VERSION = '1.0.0';

/** @type {Record<string, string>} Events the embedded runtime emits to the React shell */
const ShellOutboundEvents = {
  POMODORO: 'pomodoro',
  RECYCLEBIN: 'recyclebin',
  WINDOW_FLASH_START: 'window-flash-start',
  WINDOW_FLASH_STOP: 'window-flash-stop',
  SETTINGS: 'settings',
  POWER_OFF: 'power-off',
};

/** @typedef {{ openApp?: (appKey: string) => void, onEmbeddedReady?: () => void }} ShellHandlers */

/** @typedef {{
 *   mount?: (appKey: string, winId: string, el: Element) => void,
 *   unmount?: (winId: string) => void,
 *   showDateTimeDialog?: () => void,
 *   showLockScreen?: () => void,
 *   initLockScreen?: () => void,
 *   saveSession?: () => void,
 * }} EmbeddedHandlers */

/** @type {ShellHandlers|null} */
let shellHandlers = null;

/** @type {EmbeddedHandlers} */
let embeddedHandlers = {};

/** @type {object[]|null} */
let manifest = null;

let lockScreenInitialized = false;

/** @type {{ userName: string }} */
let cachedSettings = { userName: 'User' };

function notifyShell(event, detail) {
  if (event === ShellOutboundEvents.SETTINGS && detail) {
    cachedSettings = Object.assign({}, cachedSettings, detail);
  }
  window.dispatchEvent(new CustomEvent('winxp:' + event, { detail }));
}

function tryEmbeddedReady() {
  if (shellHandlers && shellHandlers.onEmbeddedReady && Object.keys(embeddedHandlers).length > 0) {
    shellHandlers.onEmbeddedReady();
  }
}

const ShellAPI = {
  version: SHELL_API_VERSION,
  events: ShellOutboundEvents,

  /** @param {ShellHandlers|null} handlers */
  registerShell(handlers) {
    shellHandlers = handlers || null;
    tryEmbeddedReady();
  },

  /** Merges embedded-side handlers (mount, dialogs, lock screen, …). */
  registerEmbedded(handlers) {
    if (handlers) Object.assign(embeddedHandlers, handlers);
    tryEmbeddedReady();
  },

  /** @param {object[]} m */
  setManifest(m) {
    manifest = m;
  },

  getManifest() {
    return manifest;
  },

  // --- Embedded → Shell ---

  openApp(appKey) {
    if (shellHandlers && typeof shellHandlers.openApp === 'function') {
      shellHandlers.openApp(appKey);
    }
  },

  notify: notifyShell,

  getSettings() {
    return Object.assign({}, cachedSettings);
  },

  // --- Shell → Embedded ---

  mount(appKey, winId, el) {
    if (typeof embeddedHandlers.mount === 'function') {
      embeddedHandlers.mount(appKey, winId, el);
    }
  },

  unmount(winId) {
    if (typeof embeddedHandlers.unmount === 'function') {
      embeddedHandlers.unmount(winId);
    }
  },

  showDateTimeDialog() {
    if (typeof embeddedHandlers.showDateTimeDialog === 'function') {
      embeddedHandlers.showDateTimeDialog();
    }
  },

  showLockScreen() {
    if (typeof embeddedHandlers.showLockScreen === 'function') {
      embeddedHandlers.showLockScreen();
    }
  },

  initLockScreen() {
    if (lockScreenInitialized) return;
    if (typeof embeddedHandlers.initLockScreen === 'function') {
      embeddedHandlers.initLockScreen();
      lockScreenInitialized = true;
    }
  },

  isLockScreenInitialized() {
    return lockScreenInitialized;
  },

  saveSession() {
    if (typeof embeddedHandlers.saveSession === 'function') {
      embeddedHandlers.saveSession();
    }
  },
};

window.ShellAPI = ShellAPI;