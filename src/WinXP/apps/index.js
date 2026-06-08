/**
 * Thin re-export layer.
 * All authoritative app definitions now live in APP_REGISTRY (EmbeddedApp/appRegistry.js).
 * The generator in registry.js produces the shapes consumed by the shell.
 */
import {
  appSettings,
  defaultIconState as generatedDefaultIconState,
} from './EmbeddedApp/registry';

// The single source of truth (generated)
export { appSettings };

/** Clean desktop on startup — apps open only when the user launches them. */
export const defaultAppState = [];

// Preserve classic visual order of the original 4 stock icons + the rest from registry
const preferredOrder = ['Internet Explorer', 'Minesweeper', 'Winamp', 'Paint'];
const preferred = preferredOrder
  .map((t) => generatedDefaultIconState.find((i) => i.title === t))
  .filter(Boolean);
const rest = generatedDefaultIconState.filter(
  (i) => !preferredOrder.includes(i.title),
);

export const defaultIconState = [...preferred, ...rest];

// Re-export the declarative registry for future use / introspection
export { APP_REGISTRY } from './EmbeddedApp/appRegistry';

// Re-export key builders so consumers don't import deep into EmbeddedApp
export {
  buildPinnedStartMenuItems,
  buildMenuAliasMap,
  buildProductivitySuiteMenuItems,
} from './EmbeddedApp/appRegistry';

// Named component re-exports for any remaining direct imports (temporary during migration)
export { default as InternetExplorer } from './InternetExplorer';
export { default as Minesweeper } from './Minesweeper';
export { default as ErrorBox } from './ErrorBox';
export { default as Winamp } from './Winamp';
export { default as Paint } from './Paint';
