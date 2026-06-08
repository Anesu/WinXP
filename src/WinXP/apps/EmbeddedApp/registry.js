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
  buildMenuAliasMap,
  buildProductivitySuiteMenuItems,
  buildPinnedStartMenuItems,
  appRegistryByKey,
} from './appRegistry';

export const embeddedAppSettings = {};
export const embeddedComponents = {};

APP_REGISTRY.forEach((def) => {
  const component = createEmbeddedApp({
    ...def,
    title: def.displayTitle,
    displayName: `XpApp_${def.appKey}`,
  });
  embeddedComponents[def.displayTitle] = component;
  embeddedAppSettings[def.displayTitle] = {
    header: {
      title: def.headerTitle,
      icon: def.headerIcon,
      iconFull: def.headerIconFull,
    },
    component,
    defaultSize: def.defaultSize,
    defaultOffset: def.defaultOffset,
    resizable: def.resizable !== false,
    minimized: false,
    maximized: window.innerWidth < 800,
    multiInstance: !!def.multiInstance,
  };
});

export const appByKey = Object.fromEntries(
  APP_REGISTRY.map((def) => [
    def.appKey,
    embeddedAppSettings[def.displayTitle],
  ]),
);
