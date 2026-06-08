import fs from 'fs';
import path from 'path';
import {
  APP_REGISTRY,
  EMBEDDED_BOOTSTRAP_SCRIPTS,
  EMBEDDED_GLOBAL_SCRIPTS,
  SHELL_TEMPLATE_PATH,
  STORE_SCRIPTS,
  getEmbeddedAppManifest,
  getEmbeddedScriptChain,
  getTemplatePath,
  getTemplatePathByAppKey,
} from '../appRegistry';

const ROOT = path.resolve(__dirname, '../../../../..');

describe('appRegistry seams', () => {
  it('resolves template paths by appKey convention', () => {
    expect(getTemplatePath({ appKey: 'mail' })).toBe('/apps/templates/mail.html');
    expect(getTemplatePathByAppKey('journal')).toBe(
      '/apps/templates/journal.html',
    );
  });

  it('honours explicit templatePath override', () => {
    expect(
      getTemplatePath({
        appKey: 'mail',
        templatePath: '/apps/templates/custom-mail.html',
      }),
    ).toBe('/apps/templates/custom-mail.html');
  });

  it('every registry app has a template file containing its templateId', () => {
    for (const def of APP_REGISTRY) {
      const templatePath = getTemplatePath(def);
      const full = path.join(ROOT, 'public', templatePath);
      expect(fs.existsSync(full)).toBe(true);
      const html = fs.readFileSync(full, 'utf8');
      expect(html).toContain(`id="${def.templateId}"`);
    }
  });

  it('shell template bundle exists with lock screen dialog', () => {
    const full = path.join(ROOT, 'public', SHELL_TEMPLATE_PATH);
    const html = fs.readFileSync(full, 'utf8');
    expect(html).toContain('id="tpl-lockscreen"');
    expect(html).toContain('id="tpl-datetime-dialog"');
  });

  it('store scripts load core before init and shell-api before vendor98', () => {
    expect(STORE_SCRIPTS[0]).toBe('/apps/stores/core.js');
    expect(STORE_SCRIPTS[STORE_SCRIPTS.length - 1]).toBe(
      '/apps/stores/init.js',
    );
    const shellApiIdx = EMBEDDED_BOOTSTRAP_SCRIPTS.indexOf('/apps/shell-api.js');
    const vendorIdx = EMBEDDED_BOOTSTRAP_SCRIPTS.indexOf(
      '/apps/vendor/98/vendor98.js',
    );
    expect(shellApiIdx).toBeGreaterThan(-1);
    expect(shellApiIdx).toBeLessThan(vendorIdx);
  });

  it('embedded script chain orders bootstrap, apps, then globals', () => {
    const chain = getEmbeddedScriptChain();
    const firstApp = chain.indexOf('/apps/apps/recyclebin.js');
    const bridge = chain.indexOf('/apps/embedded-bridge.js');
    const lastBootstrap = chain.indexOf('/apps/vendor/98/vendor98.js');

    expect(chain[0]).toBe('/apps/qrcode.js');
    expect(lastBootstrap).toBeLessThan(firstApp);
    expect(firstApp).toBeLessThan(bridge);
    expect(chain[chain.length - 1]).toBe('/apps/apps/lockscreen.js');
  });

  it('manifest entries cover every appKey with title and init metadata', () => {
    const manifest = getEmbeddedAppManifest();
    expect(manifest).toHaveLength(APP_REGISTRY.length);
    for (const def of APP_REGISTRY) {
      const entry = manifest.find((m) => m.appKey === def.appKey);
      expect(entry).toBeDefined();
      expect(entry.title).toBeTruthy();
      if (def.useCpInit) {
        expect(entry.useCpInit).toBe(true);
        expect(entry.initFn).toBeNull();
      }
      if (def.cleanupKey) {
        expect(entry.cleanup).toBe(def.cleanupKey);
      }
    }
  });

  it('every referenced public script and store file exists on disk', () => {
    const chain = getEmbeddedScriptChain();
    for (const src of chain) {
      expect(fs.existsSync(path.join(ROOT, 'public', src))).toBe(true);
    }
    for (const src of [...EMBEDDED_BOOTSTRAP_SCRIPTS, ...EMBEDDED_GLOBAL_SCRIPTS]) {
      expect(fs.existsSync(path.join(ROOT, 'public', src))).toBe(true);
    }
  });
});