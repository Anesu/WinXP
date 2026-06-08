import {
  ShellEvents,
  subscribeShellEvent,
  wireShellBridge,
} from '../shellBridge';
import fs from 'fs';
import { publicPath } from '../testHelpers/loadPublicScript';

function installShellAPI() {
  delete window.ShellAPI;
  const src = fs.readFileSync(publicPath('apps', 'shell-api.js'), 'utf8');
  // eslint-disable-next-line no-new-func
  new Function(src)();
  return window.ShellAPI;
}

describe('shellBridge seam', () => {
  beforeEach(() => {
    installShellAPI();
  });

  afterEach(() => {
    delete window.ShellAPI;
  });

  it('ShellEvents match ShellAPI outbound event names', () => {
    expect(ShellEvents.POMODORO).toBe(window.ShellAPI.events.POMODORO);
    expect(ShellEvents.RECYCLEBIN).toBe(window.ShellAPI.events.RECYCLEBIN);
    expect(ShellEvents.WINDOW_FLASH_START).toBe(
      window.ShellAPI.events.WINDOW_FLASH_START,
    );
    expect(ShellEvents.WINDOW_FLASH_STOP).toBe(
      window.ShellAPI.events.WINDOW_FLASH_STOP,
    );
    expect(ShellEvents.SETTINGS).toBe(window.ShellAPI.events.SETTINGS);
    expect(ShellEvents.POWER_OFF).toBe(window.ShellAPI.events.POWER_OFF);
  });

  it('wireShellBridge registers openApp on ShellAPI', () => {
    const openApp = jest.fn();
    wireShellBridge(openApp);
    window.ShellAPI.openApp('todo');
    expect(openApp).toHaveBeenCalledWith('todo');
  });

  it('subscribeShellEvent receives notify payloads', () => {
    const handler = jest.fn();
    const unsub = subscribeShellEvent(ShellEvents.POMODORO, handler);
    window.ShellAPI.notify(ShellEvents.POMODORO, { minutes: 25, seconds: 0 });
    expect(handler).toHaveBeenCalledWith({
      minutes: 25,
      seconds: 0,
    });
    unsub();
    window.ShellAPI.notify(ShellEvents.POMODORO, { minutes: 1, seconds: 0 });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
