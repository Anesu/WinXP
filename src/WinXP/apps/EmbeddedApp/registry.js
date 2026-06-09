import { createEmbeddedApp } from './createEmbeddedApp';
import { APP_REGISTRY } from './appRegistry';

export {
  APP_REGISTRY,
  desktopEmbeddedApps,
  embeddedAppDefs,
} from './appRegistry';
export {
  getEmbeddedScriptChain,
  getEmbeddedAppManifest,
  STORE_SCRIPTS,
  SHELL_TEMPLATE_PATH,
  getTemplatePath,
  getTemplatePathByAppKey,
  buildMenuAliasMap,
  buildProductivitySuiteMenuItems,
  buildPinnedStartMenuItems,
  appRegistryByKey,
} from './appRegistry';

export const embeddedAppSettings = {};
export const embeddedComponents = {};

/**
 * Unified app settings — single source of truth shape consumed by WinXP shell,
 * Windows component, Icons, etc.
 */
export const appSettings = {};

/**
 * Icons that should appear on the desktop by default (both native + embedded).
 */
const generatedDefaultIconState = [];
export const defaultAppState = [];

APP_REGISTRY.forEach((def) => {
  let component;

  if (def.component) {
    // Native React component (legacy apps: IE, Minesweeper, Paint, Winamp, Error)
    component = def.component;
    embeddedComponents[def.displayTitle] = component; // for backward compat during migration
  } else {
    // Embedded (HTML/JS loaded via AppShell)
    component = createEmbeddedApp({
      ...def,
      title: def.displayTitle,
      displayName: `XpApp_${def.appKey}`,
    });
    embeddedComponents[def.displayTitle] = component;
  }

  const isNative = !!def.component;

  // Build the header (support special cases that existed in the old appSettings)
  const header = {
    icon: def.headerIcon,
    title: def.headerTitle,
    ...(def.headerIconFull && { iconFull: def.headerIconFull }),
  };

  if (def.appKey === 'error') {
    header.buttons = ['close'];
    header.noFooterWindow = true;
  }
  if (def.appKey === 'winamp') {
    header.invisible = true;
  }

  const settingsEntry = {
    header,
    component,
    defaultSize: def.defaultSize,
    defaultOffset: def.defaultOffset,
    resizable: def.resizable !== false,
    minimized: false,
    maximized: window.innerWidth < 800,
    multiInstance: !!def.multiInstance,
  };

  // Special runtime-centered offset for Error (preserves old behavior)
  if (def.appKey === 'error') {
    settingsEntry.defaultOffset = {
      x: window.innerWidth / 2 - 190,
      y: window.innerHeight / 2 - 60,
    };
  }

  // Register under displayTitle (what most of the shell code uses)
  appSettings[def.displayTitle] = settingsEntry;

  // Also keep old embedded-only map during transition
  if (!isNative) {
    embeddedAppSettings[def.displayTitle] = settingsEntry;
  }
});

// Build desktop icons from registry (showOnDesktop defaults to true unless explicitly false)
APP_REGISTRY.filter((def) => def.showOnDesktop !== false).forEach(
  (def, index) => {
    const settings = appSettings[def.displayTitle];
    if (!settings) return;

    generatedDefaultIconState.push({
      id: 100 + index, // will be adjusted by consumer if needed
      icon: def.desktopIcon,
      iconFull: def.desktopIconFull,
      appKey: def.appKey,
      title: def.displayTitle,
      component: settings.component,
      isFocus: false,
    });
  },
);

const preferredOrder = ['Internet Explorer', 'Minesweeper', 'Winamp', 'Paint'];
const preferred = preferredOrder
  .map((t) => generatedDefaultIconState.find((i) => i.title === t))
  .filter(Boolean);
const rest = generatedDefaultIconState.filter(
  (i) => !preferredOrder.includes(i.title),
);

export const defaultIconState = [...preferred, ...rest];

// Legacy hard-coded non-productivity icons (IE, Minesweeper, Winamp, Paint) are now also in APP_REGISTRY
// The filter above + APP_REGISTRY entries will include them.

export const appByKey = Object.fromEntries(
  APP_REGISTRY.map((def) => [def.appKey, appSettings[def.displayTitle]]),
);

// Populate the old names from the unified source (for gradual migration of importers)
Object.assign(embeddedAppSettings, appSettings);

// Note: desktopEmbeddedApps is still exported from appRegistry.js via the old filter.
// We will consolidate further in a follow-up edit.
