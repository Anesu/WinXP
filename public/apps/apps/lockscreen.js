// ===== LOCK SCREEN =====
let lockTimer = null;
const LOCK_TIMEOUT = 180000;

function initLockScreen() {
  resetLockTimer();
  document.addEventListener('mousemove', resetLockTimer);
  document.addEventListener('keydown', resetLockTimer);
  document.addEventListener('click', resetLockTimer);
  document.addEventListener('scroll', resetLockTimer);
}

function resetLockTimer() {
  if (lockTimer) clearTimeout(lockTimer);
  if (document.querySelector('.lockscreen-overlay')) return;
  lockTimer = setTimeout(showLockScreen, LOCK_TIMEOUT);
}

function showLockScreen() {
  if (document.querySelector('.lockscreen-overlay')) return;
  const tpl = document.getElementById('tpl-lockscreen');
  const clone = tpl.content.firstElementChild.cloneNode(true);
  document.body.appendChild(clone);
  updateLockScreenDateTime();
  const interval = setInterval(updateLockScreenDateTime, 10000);
  clone.dataset.intervalId = interval;
  
  clone.addEventListener('click', () => {
    if (document.querySelector('.lock-pin-dialog')) return;
    const pinEnabled = controlPanelStore?.lockPinEnabled || false;
    const pinCode = controlPanelStore?.lockPin;
    if (pinEnabled && pinCode) {
      showLockPinDialog(clone);
    } else {
      unlockScreen(clone);
    }
  });
}

function updateLockScreenDateTime() {
  const el = document.querySelector('#lockscreen-datetime');
  if (!el) return;
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  el.textContent = DAYS_FULL[now.getDay()] + ', ' + MONTHS_FULL[now.getMonth()] + ' ' + now.getDate() + '  ' + h + ':' + String(m).padStart(2,'0') + ' ' + ampm;
}

function showLockPinDialog(overlay) {
  const tpl = document.getElementById('tpl-lock-pin-dialog');
  if (!tpl) return;
  const dialog = tpl.content.firstElementChild.cloneNode(true);
  document.body.appendChild(dialog);
  
  const input = dialog.querySelector('#lock-pin-input');
  const errorEl = dialog.querySelector('#lock-pin-error');
  const okBtn = dialog.querySelector('#lock-pin-ok-btn');
  const cancelBtn = dialog.querySelector('#lock-pin-cancel-btn');
  
  if (input) {
    input.focus();
    dialog.addEventListener('click', (e) => e.stopPropagation());
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        validatePin();
      } else if (e.key === 'Escape') {
        closeDialog();
      }
    });
  }
  
  if (okBtn) {
    okBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      validatePin();
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDialog();
    });
  }
  
  function closeDialog() {
    dialog.remove();
  }
  
  function validatePin() {
    const pin = input.value;
    const correctPin = controlPanelStore?.lockPin;
    if (pin === correctPin) {
      dialog.remove();
      unlockScreen(overlay);
    } else {
      if (errorEl) {
        errorEl.textContent = 'Incorrect PIN. Try again.';
      }
      input.value = '';
      input.focus();
    }
  }
}

function unlockScreen(overlay) {
  const interval = parseInt(overlay.dataset.intervalId);
  if (interval) clearInterval(interval);
  if (overlay) overlay.remove();
}
