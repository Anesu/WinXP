import AppShell from './AppShell';

export function createEmbeddedApp(config) {
  function EmbeddedApp({ winId }) {
    return (
      <AppShell
        appKey={config.appKey}
        templateId={config.templateId}
        initFn={config.initFn}
        winId={winId}
      />
    );
  }
  EmbeddedApp.displayName = config.displayName || config.title;
  EmbeddedApp.embeddedConfig = config;
  return EmbeddedApp;
}
