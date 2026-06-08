import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getEmbeddedScriptChain, getEmbeddedAppManifest } from './appRegistry';

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

let templatesReady = false;
async function ensureTemplates() {
  if (templatesReady || document.getElementById('tpl-todo')) {
    templatesReady = true;
    return;
  }
  const res = await fetch(`${APPS_BASE}templates.html`);
  let html = await res.text();
  html = html.replace(/src="vendor\//g, `src="${APPS_BASE}vendor/`);
  const host = document.getElementById('app-templates') || document.body;
  host.insertAdjacentHTML('beforeend', html);
  templatesReady = true;
}

let scriptsReady = false;

export async function preloadEmbeddedApps() {
  await ensureTemplates();
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
      await ensureTemplates();
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
