import fs from 'fs';
import vm from 'vm';
import { publicPath } from '../testHelpers/loadPublicScript';

function freshShellAPI() {
  const src = fs.readFileSync(publicPath('apps', 'shell-api.js'), 'utf8');
  const events = [];
  const sandbox = {
    CustomEvent: global.CustomEvent,
    dispatchEvent: (e) => events.push(e),
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return { ShellAPI: sandbox.ShellAPI, events };
}

describe('ShellAPI seam', () => {
  it('exposes version and outbound event constants', () => {
    const { ShellAPI } = freshShellAPI();
    expect(ShellAPI.version).toBe('1.0.0');
    expect(ShellAPI.events).toEqual({
      POMODORO: 'pomodoro',
      RECYCLEBIN: 'recyclebin',
      WINDOW_FLASH_START: 'window-flash-start',
      WINDOW_FLASH_STOP: 'window-flash-stop',
      SETTINGS: 'settings',
      POWER_OFF: 'power-off',
    });
  });

  it('routes openApp from embedded to shell handlers', () => {
    const { ShellAPI } = freshShellAPI();
    const openApp = jest.fn();
    ShellAPI.registerShell({ openApp });
    ShellAPI.openApp('mail');
    expect(openApp).toHaveBeenCalledWith('mail');
  });

  it('routes mount/unmount between shell and embedded handlers', () => {
    const { ShellAPI } = freshShellAPI();
    const mount = jest.fn();
    const unmount = jest.fn();
    const el = document.createElement('div');
    ShellAPI.registerEmbedded({ mount, unmount });

    ShellAPI.mount('journal', '42', el);
    expect(mount).toHaveBeenCalledWith('journal', '42', el);

    ShellAPI.unmount('42');
    expect(unmount).toHaveBeenCalledWith('42');
  });

  it('merges embedded handlers incrementally', () => {
    const { ShellAPI } = freshShellAPI();
    const mount = jest.fn();
    const showLockScreen = jest.fn();
    ShellAPI.registerEmbedded({ mount });
    ShellAPI.registerEmbedded({ showLockScreen });

    ShellAPI.mount('todo', '1', document.createElement('div'));
    ShellAPI.showLockScreen();
    expect(mount).toHaveBeenCalled();
    expect(showLockScreen).toHaveBeenCalled();
  });

  it('stores and returns manifest for embedded-bridge', () => {
    const { ShellAPI } = freshShellAPI();
    const manifest = [{ appKey: 'mail', title: 'Outlook Express' }];
    ShellAPI.setManifest(manifest);
    expect(ShellAPI.getManifest()).toBe(manifest);
  });

  it('notify dispatches winxp:* CustomEvents', () => {
    const { ShellAPI, events } = freshShellAPI();
    ShellAPI.notify(ShellAPI.events.RECYCLEBIN, { full: true });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('winxp:recyclebin');
    expect(events[0].detail).toEqual({ full: true });
  });

  it('caches settings and exposes them via getSettings', () => {
    const { ShellAPI } = freshShellAPI();
    expect(ShellAPI.getSettings()).toEqual({ userName: 'User' });
    ShellAPI.notify(ShellAPI.events.SETTINGS, { userName: 'Anesu' });
    expect(ShellAPI.getSettings()).toEqual({ userName: 'Anesu' });
  });

  it('calls onEmbeddedReady when both sides register', () => {
    const { ShellAPI } = freshShellAPI();
    const onEmbeddedReady = jest.fn();
    ShellAPI.registerEmbedded({ mount: jest.fn() });
    ShellAPI.registerShell({ openApp: jest.fn(), onEmbeddedReady });
    expect(onEmbeddedReady).toHaveBeenCalledTimes(1);
  });

  it('initLockScreen runs once', () => {
    const { ShellAPI } = freshShellAPI();
    const initLockScreen = jest.fn();
    ShellAPI.registerEmbedded({ initLockScreen });

    ShellAPI.initLockScreen();
    ShellAPI.initLockScreen();
    expect(initLockScreen).toHaveBeenCalledTimes(1);
    expect(ShellAPI.isLockScreenInitialized()).toBe(true);
  });
});
