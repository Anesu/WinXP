import fs from 'fs';
import path from 'path';
import vm from 'vm';

const ROOT = path.resolve(__dirname, '../../../../..');

export function publicPath(...segments) {
  return path.join(ROOT, 'public', ...segments);
}

/** Load a public/apps script into an isolated sandbox with a fresh window. */
export function loadPublicScript(relativePath, extraSandbox = {}) {
  const src = fs.readFileSync(publicPath('apps', relativePath), 'utf8');
  const sandbox = {
    window: {},
    CustomEvent: global.CustomEvent,
    localStorage: createMemoryStorage(),
    document: global.document,
    setTimeout,
    clearTimeout,
    Date,
    JSON,
    Object,
    Array,
    Set,
    Map,
    Proxy,
    ...extraSandbox,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox;
}

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
  };
}
