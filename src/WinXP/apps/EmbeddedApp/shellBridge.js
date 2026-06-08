import { useEffect } from 'react';

/** @enum {string} Outbound events from embedded runtime → React shell */
export const ShellEvents = {
  POMODORO: 'pomodoro',
  RECYCLEBIN: 'recyclebin',
  WINDOW_FLASH_START: 'window-flash-start',
  WINDOW_FLASH_STOP: 'window-flash-stop',
  SETTINGS: 'settings',
  POWER_OFF: 'power-off',
};

/**
 * Register React shell handlers on the formal ShellAPI seam.
 * @param {(appKey: string) => void} openApp
 */
export function wireShellBridge(openApp) {
  if (typeof window.ShellAPI === 'undefined') return;
  window.ShellAPI.registerShell({ openApp });
}

/**
 * Subscribe to an outbound embedded → shell event.
 * @param {string} event
 * @param {(detail: unknown) => void} handler
 * @returns {() => void} unsubscribe
 */
export function subscribeShellEvent(event, handler) {
  const listener = (e) => handler(e.detail);
  window.addEventListener(`winxp:${event}`, listener);
  return () => window.removeEventListener(`winxp:${event}`, listener);
}

/**
 * React hook for embedded → shell CustomEvents.
 * @param {string} event
 * @param {(detail: unknown) => void} handler
 */
export function useShellEvent(event, handler) {
  useEffect(() => subscribeShellEvent(event, handler), [event, handler]);
}
