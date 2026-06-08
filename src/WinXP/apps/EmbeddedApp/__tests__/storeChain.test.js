import fs from 'fs';
import vm from 'vm';
import { loadPublicScript, publicPath } from '../testHelpers/loadPublicScript';
import { STORE_SCRIPTS } from '../appRegistry';

describe('store chain seam', () => {
  it('fmtDate helper formats ISO dates from core store', () => {
    const sandbox = loadPublicScript('stores/core.js');
    expect(sandbox.fmtDate(new Date(2026, 5, 8))).toBe('2026-06-08');
  });

  it('todo store persists through split module chain', () => {
    jest.useFakeTimers();
    const sandbox = loadPublicScript('stores/core.js');
    for (const script of STORE_SCRIPTS.slice(1)) {
      const rel = script.replace('/apps/', '');
      const src = fs.readFileSync(publicPath('apps', rel), 'utf8');
      vm.runInContext(src, sandbox);
    }

    const todoStore = vm.runInContext('todoStore', sandbox);
    const todo = todoStore.add({ text: 'Seam test task' });
    jest.runAllTimers();
    expect(todo.text).toBe('Seam test task');
    expect(todoStore.get(todo.id)).toEqual(
      expect.objectContaining({ text: 'Seam test task' }),
    );

    const raw = sandbox.localStorage.getItem('win95_fs');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.todos.some((t) => t.id === todo.id)).toBe(true);
    jest.useRealTimers();
  });
});