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
    getUserName() { return this.get('userName', 'User'); },
    getPinEnabled() { return this.getPasswordEnabled(); },
    getPinCode() { return this.getPassword(); },
    setPin(code) { this.setPassword(code); },
    clearPin() { this.clearPassword(); },
    getPasswordEnabled() { return this.get('lockPinEnabled', false); },
    getPassword() { return this.get('lockPin', ''); },
    setPassword(password) {
      this.set('lockPin', password);
      this.set('lockPinEnabled', true);
    },
    clearPassword() {
      this.set('lockPin', '');
      this.set('lockPinEnabled', false);
    },
  };
}
