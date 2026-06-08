// ── IconStore ───────────────────────────────────────────────
function createIconStore() {
  if (!fs.iconOffsets) fs.iconOffsets = {};
  const save = saveFilesystem;
  return {
    get(app) { return fs.iconOffsets[app] || null; },
    set(app, x, y) { fs.iconOffsets[app] = { x, y }; save(); },
    remove(app) { delete fs.iconOffsets[app]; save(); },
    all() { return Object.assign({}, fs.iconOffsets); },
    reset() { fs.iconOffsets = {}; save(); },
  };
}
