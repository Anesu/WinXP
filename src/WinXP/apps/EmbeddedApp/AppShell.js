import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
  getEmbeddedScriptChain,
  getEmbeddedAppManifest,
  getTemplatePathByAppKey,
  SHELL_TEMPLATE_PATH,
} from './appRegistry';
import { isTemplateLoaded, loadTemplateBundle } from './templateLoader';

const PUBLIC = process.env.PUBLIC_URL || '';
const APPS_BASE = `${PUBLIC}/apps/`;

function loadScriptOnce(src) {
  const full = src.startsWith('http') ? src : `${PUBLIC}${src}`;
  if (document.querySelector(`script[data-embedded-src="${full}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = full;
    script.dataset.embeddedSrc = full;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${full}`));
    document.body.appendChild(script);
  });
}

let shellTemplatesReady = false;

async function ensureShellTemplates() {
  if (shellTemplatesReady || isTemplateLoaded('tpl-lockscreen')) {
    shellTemplatesReady = true;
    return;
  }
  await loadTemplateBundle(SHELL_TEMPLATE_PATH);
  shellTemplatesReady = true;
}

async function ensureAppTemplate(appKey, templateId) {
  await ensureShellTemplates();
  if (isTemplateLoaded(templateId)) return;
  await loadTemplateBundle(getTemplatePathByAppKey(appKey));
}

let scriptsReady = false;

export async function preloadEmbeddedApps() {
  await ensureShellTemplates();
  await ensureAppScripts();
}

async function ensureAppScripts() {
  if (scriptsReady) return;
  window.APPS_PUBLIC_BASE = APPS_BASE;
  await loadScriptOnce('/apps/shell-api.js');
  window.ShellAPI.setManifest(getEmbeddedAppManifest());
  const chain = getEmbeddedScriptChain().filter(
    (src) => src !== '/apps/shell-api.js',
  );
  for (const src of chain) {
    await loadScriptOnce(src);
  }
  scriptsReady = true;
  if (window.ShellAPI && !window.ShellAPI.isLockScreenInitialized()) {
    window.ShellAPI.initLockScreen();
  }
}

export default function AppShell({ appKey, templateId, initFn, winId }) {
  const hostRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const bridgeWinId = String(winId);

    async function mount() {
      await ensureAppTemplate(appKey, templateId);
      await ensureAppScripts();
      if (!mounted || !hostRef.current) return;

      const tpl = document.getElementById(templateId);
      if (!tpl) return;

      const clone = tpl.content.firstElementChild.cloneNode(true);
      clone.classList.add('xp-embedded');
      clone.dataset.winId = bridgeWinId;
      clone.style.position = 'relative';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.width = '100%';
      clone.style.height = '100%';
      clone.style.boxShadow = 'none';

      hostRef.current.innerHTML = '';
      hostRef.current.appendChild(clone);

      if (window.ShellAPI) {
        window.ShellAPI.mount(appKey, bridgeWinId, clone);
      } else if (typeof window.initEmbeddedApp === 'function') {
        window.initEmbeddedApp(appKey, bridgeWinId, clone);
      } else if (initFn && typeof window[initFn] === 'function') {
        window.registerAppWindow(bridgeWinId, clone, appKey);
        window[initFn](bridgeWinId, clone);
      }
    }

    mount();

    return () => {
      mounted = false;
      if (window.ShellAPI) {
        window.ShellAPI.unmount(bridgeWinId);
      } else if (typeof window.unregisterAppWindow === 'function') {
        window.unregisterAppWindow(bridgeWinId);
      }
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, [appKey, templateId, initFn, winId]);

  return <Host ref={hostRef} className="xp-app-host" />;
}

const Host = styled.div`
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ece9d8;

  .xp-embedded .win-titlebar,
  .xp-embedded .win-titlebar-btns {
    display: none !important;
  }

  .xp-embedded.win95-window {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: none !important;
    background: transparent;
  }

  .xp-embedded .win-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .xp-embedded .win-content,
  .xp-embedded .mycomputer-content {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
`;
