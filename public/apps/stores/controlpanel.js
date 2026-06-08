// ── ControlPanelStore ───────────────────────────────────────
function createControlPanelStore() {
  if (!fs.controlpanel) fs.controlpanel = {};
  const save = saveFilesystem;
  return {
    get(key, fallback) { return key in fs.controlpanel ? fs.controlpanel[key] : fallback; },
    set(key, value) { fs.controlpanel[key] = value; save(); },
    getAll() { return Object.assign({}, fs.controlpanel); },
    getWorkDuration() { return this.get('pomodoroWork', 25); },
    getBreakDuration() { return this.get('pomodoroBreak', 5); },
    getClockFormat() { return this.get('clockFormat', '12'); },
    getShowClock() { return this.get('showClock', true); },
    getDesktopTheme() { return this.get('desktopTheme', 'teal'); },
    getMailSender() { return this.get('mailSender', ''); },
    getMailSignature() { return this.get('mailSignature', ''); },
    getPinEnabled() { return this.get('lockPinEnabled', false); },
    getPinCode() { return this.get('lockPin', ''); },
    setPin(code) { this.set('lockPin', code); this.set('lockPinEnabled', !!code); },
    clearPin() { this.set('lockPin', ''); this.set('lockPinEnabled', false); },
  };
}
