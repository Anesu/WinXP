// ============================================================
//  QRX TRANSMITTER APP
// ============================================================

function initQrtxApp(winId, el) {
  const qrtxState = {
    loopIntervalId: null,
    currentFrameIndex: 0,
    compiledFrames: [],
    activeSessionTxId: null,
    activeTab: 'text',
    uploadedFileBase64: null,
    uploadedFileName: '',
    uploadedFileSize: 0,
    qrEngine: null,
    previousTextBase64State: false
  };
  state.windows[winId].qrtxState = qrtxState;

  const qrContainer = el.querySelector('.qrtx-qrcode');
  qrtxState.qrEngine = new QRCode(qrContainer, {
    width: 170,
    height: 170,
    correctLevel: QRCode.CorrectLevel.L
  });

  // Tab switching
  const tabs = el.querySelectorAll('.qrtx-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabType = tab.dataset.tab;
      qrtxState.activeTab = tabType;
      
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      el.querySelector('.qrtx-panel-text').style.display = tabType === 'text' ? 'flex' : 'none';
      el.querySelector('.qrtx-panel-file').style.display = tabType === 'file' ? 'flex' : 'none';
      
      const b64Chk = el.querySelector('.qrtx-base64-checkbox');
      if (tabType === 'file') {
        qrtxState.previousTextBase64State = b64Chk.checked;
        b64Chk.checked = true;
        b64Chk.disabled = true;
      } else {
        b64Chk.checked = !!qrtxState.previousTextBase64State;
        b64Chk.disabled = false;
      }
      processSourceData();
    });
  });

  // Drag and drop / file input
  const dropZone = el.querySelector('.qrtx-drop-zone');
  const fileInput = el.querySelector('.qrtx-file-input');

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, e => {
      e.preventDefault();
      dropZone.style.background = '#e8f0ff';
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, e => {
      e.preventDefault();
      dropZone.style.background = '#fff';
    });
  });

  dropZone.addEventListener('drop', e => {
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  });

  function handleFile(file) {
    qrtxState.uploadedFileName = file.name;
    qrtxState.uploadedFileSize = Math.round(file.size / 1024);
    qrtxState.activeSessionTxId = Math.floor(Math.random() * 90000) + 10000;
    el.querySelector('.qrtx-stat-tx-id').innerText = qrtxState.activeSessionTxId;

    const reader = new FileReader();
    reader.onload = function(evt) {
      const bytes = new Uint8Array(evt.target.result);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      qrtxState.uploadedFileBase64 = btoa(binary);
      el.querySelector('.qrtx-file-details').innerText = `${file.name} (${qrtxState.uploadedFileSize} KB)`;
      el.querySelector('.qrtx-file-banner').style.display = 'flex';
      dropZone.style.display = 'none';

      const b64Chk = el.querySelector('.qrtx-base64-checkbox');
      b64Chk.checked = true;
      b64Chk.disabled = true;
      processSourceData();
    };
    reader.readAsArrayBuffer(file);
  }

  el.querySelector('.qrtx-file-remove').addEventListener('click', () => {
    qrtxState.uploadedFileBase64 = null;
    qrtxState.uploadedFileName = '';
    qrtxState.uploadedFileSize = 0;
    qrtxState.activeSessionTxId = null;
    el.querySelector('.qrtx-stat-tx-id').innerText = '----';
    fileInput.value = '';
    el.querySelector('.qrtx-file-banner').style.display = 'none';
    dropZone.style.display = 'flex';

    const b64Chk = el.querySelector('.qrtx-base64-checkbox');
    b64Chk.checked = false;
    b64Chk.disabled = false;
    processSourceData();
  });

  // Base64 toggle
  el.querySelector('.qrtx-base64-checkbox').addEventListener('change', processSourceData);
  // Text area inputs
  el.querySelector('.qrtx-text-input').addEventListener('input', validateInputText);

  // Sliders
  const speedSlider = el.querySelector('.qrtx-speed-slider');
  speedSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    el.querySelector('.qrtx-speed-label').innerText = val + 'ms';
    el.querySelector('.qrtx-stat-speed').innerText = (1000 / val).toFixed(1) + ' Hz';
    if (qrtxState.loopIntervalId) {
      clearInterval(qrtxState.loopIntervalId);
      runActiveLoop(parseInt(val));
    }
  });

  const chunkSlider = el.querySelector('.qrtx-chunk-slider');
  chunkSlider.addEventListener('input', (e) => {
    el.querySelector('.qrtx-chunk-label').innerText = e.target.value + ' chars';
    processSourceData();
  });

  function validateInputText() {
    const textVal = el.querySelector('.qrtx-text-input').value;
    const hasConflicts = textVal.includes('|') || textVal.includes(']');
    const b64On = el.querySelector('.qrtx-base64-checkbox').checked;
    const warning = el.querySelector('.qrtx-alert-box');
    if (hasConflicts && !b64On && qrtxState.activeTab === 'text') {
      warning.style.display = 'flex';
    } else {
      warning.style.display = 'none';
    }
  }

  function processSourceData() {
    validateInputText();
    const b64Chk = el.querySelector('.qrtx-base64-checkbox');
    el.querySelector('.qrtx-stat-mode').innerText = b64Chk.checked ? 'Base64 Encoded' : 'Plain Text';
    if (qrtxState.loopIntervalId) {
      compileActiveFrames();
    }
  }

  function compileActiveFrames() {
    let sourceData = '';
    if (qrtxState.activeTab === 'text') {
      sourceData = el.querySelector('.qrtx-text-input').value;
    } else {
      sourceData = qrtxState.uploadedFileBase64 || '';
    }

    if (!sourceData) {
      qrtxState.compiledFrames = [];
      el.querySelector('.qrtx-stat-total-frames').innerText = '0';
      return false;
    }

    const b64On = el.querySelector('.qrtx-base64-checkbox').checked;
    if (b64On && qrtxState.activeTab === 'text') {
      try {
        sourceData = btoa(unescape(encodeURIComponent(sourceData)));
      } catch (e) {
        console.error('Base64 encoding failed:', e);
      }
    }

    const limit = parseInt(el.querySelector('.qrtx-chunk-slider').value);
    const slices = [];
    for (let i = 0; i < sourceData.length; i += limit) {
      slices.push(sourceData.substring(i, i + limit));
    }

    const totalFramesCount = slices.length;
    el.querySelector('.qrtx-stat-total-frames').innerText = totalFramesCount;

    if (!qrtxState.activeSessionTxId) {
      qrtxState.activeSessionTxId = Math.floor(Math.random() * 90000) + 10000;
    }
    el.querySelector('.qrtx-stat-tx-id').innerText = qrtxState.activeSessionTxId;

    qrtxState.compiledFrames = slices.map((sliceContent, idx) => {
      return `[${qrtxState.activeSessionTxId}|${idx + 1}|${totalFramesCount}|${sliceContent}]`;
    });
    return true;
  }

  function runActiveLoop(ms) {
    const total = qrtxState.compiledFrames.length;
    const tick = () => {
      const frameContent = qrtxState.compiledFrames[qrtxState.currentFrameIndex];
      qrtxState.qrEngine.clear();
      qrtxState.qrEngine.makeCode(frameContent);

      el.querySelector('.qrtx-prog-frame').innerText = qrtxState.currentFrameIndex + 1;
      el.querySelector('.qrtx-prog-total').innerText = total;

      const percent = Math.round(((qrtxState.currentFrameIndex + 1) / total) * 100);
      el.querySelector('.qrtx-prog-percent').innerText = percent + '%';
      el.querySelector('.qrtx-prog-fill').style.width = percent + '%';
      
      el.querySelector('.qrtx-statusbar').innerText = `Sending frame ${qrtxState.currentFrameIndex + 1} of ${total}`;
      qrtxState.currentFrameIndex = (qrtxState.currentFrameIndex + 1) % total;
    };
    tick();
    qrtxState.loopIntervalId = setInterval(tick, ms);
  }

  window.qrtxStart = function(btn) {
    const win = btn.closest('.win95-window');
    const wId = win.dataset.winId;
    const wState = state.windows[wId].qrtxState;
    if (wState.activeTab === 'text') {
      wState.activeSessionTxId = null;
    }
    const targetWin = win;
    
    let sourceData = '';
    if (wState.activeTab === 'text') {
      sourceData = targetWin.querySelector('.qrtx-text-input').value;
    } else {
      sourceData = wState.uploadedFileBase64 || '';
    }

    if (!sourceData) {
      wState.compiledFrames = [];
      targetWin.querySelector('.qrtx-stat-total-frames').innerText = '0';
      alert(wState.activeTab === 'text' ? 'Textarea is empty!' : 'No file has been uploaded!');
      return;
    }

    const b64On = targetWin.querySelector('.qrtx-base64-checkbox').checked;
    if (b64On && wState.activeTab === 'text') {
      try {
        sourceData = btoa(unescape(encodeURIComponent(sourceData)));
      } catch (e) {
        console.error('Base64 encoding failed:', e);
      }
    }

    const limit = parseInt(targetWin.querySelector('.qrtx-chunk-slider').value);
    const slices = [];
    for (let i = 0; i < sourceData.length; i += limit) {
      slices.push(sourceData.substring(i, i + limit));
    }

    const totalFramesCount = slices.length;
    targetWin.querySelector('.qrtx-stat-total-frames').innerText = totalFramesCount;

    if (!wState.activeSessionTxId) {
      wState.activeSessionTxId = Math.floor(Math.random() * 90000) + 10000;
    }
    targetWin.querySelector('.qrtx-stat-tx-id').innerText = wState.activeSessionTxId;

    wState.compiledFrames = slices.map((sliceContent, idx) => {
      return `[${wState.activeSessionTxId}|${idx + 1}|${totalFramesCount}|${sliceContent}]`;
    });

    targetWin.querySelector('.qrtx-menu-start').style.display = 'none';
    targetWin.querySelector('.qrtx-menu-stop').style.display = 'inline-block';

    const pingDot = targetWin.querySelector('.qrtx-ping-dot');
    pingDot.style.background = '#008000';
    pingDot.style.animation = 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite';

    targetWin.querySelector('.qrtx-status-text').innerText = 'Broadcasting';
    targetWin.querySelector('.qrtx-scanline').style.display = 'block';

    wState.currentFrameIndex = 0;
    const intervalMs = parseInt(targetWin.querySelector('.qrtx-speed-slider').value);
    targetWin.querySelector('.qrtx-stat-speed').innerText = (1000 / intervalMs).toFixed(1) + ' Hz';

    const tick = () => {
      const frameContent = wState.compiledFrames[wState.currentFrameIndex];
      wState.qrEngine.clear();
      wState.qrEngine.makeCode(frameContent);

      targetWin.querySelector('.qrtx-prog-frame').innerText = wState.currentFrameIndex + 1;
      targetWin.querySelector('.qrtx-prog-total').innerText = totalFramesCount;

      const percent = Math.round(((wState.currentFrameIndex + 1) / totalFramesCount) * 100);
      targetWin.querySelector('.qrtx-prog-percent').innerText = percent + '%';
      targetWin.querySelector('.qrtx-prog-fill').style.width = percent + '%';
      
      targetWin.querySelector('.qrtx-statusbar').innerText = `Sending frame ${wState.currentFrameIndex + 1} of ${totalFramesCount}`;
      wState.currentFrameIndex = (wState.currentFrameIndex + 1) % totalFramesCount;
    };
    tick();
    wState.loopIntervalId = setInterval(tick, intervalMs);
  };

  window.qrtxStop = function(btn) {
    const win = btn.closest('.win95-window');
    const wId = win.dataset.winId;
    const wState = state.windows[wId].qrtxState;

    if (wState.loopIntervalId) {
      clearInterval(wState.loopIntervalId);
      wState.loopIntervalId = null;
    }

    win.querySelector('.qrtx-menu-start').style.display = 'inline-block';
    win.querySelector('.qrtx-menu-stop').style.display = 'none';

    const pingDot = win.querySelector('.qrtx-ping-dot');
    pingDot.style.background = '#808080';
    pingDot.style.animation = 'none';

    win.querySelector('.qrtx-status-text').innerText = 'Stopped';
    win.querySelector('.qrtx-scanline').style.display = 'none';
    win.querySelector('.qrtx-statusbar').innerText = 'Stopped';
  };

  window.qrtxReset = function(btn) {
    const win = btn.closest('.win95-window');
    const wId = win.dataset.winId;
    const wState = state.windows[wId].qrtxState;

    window.qrtxStop(btn);
    wState.activeSessionTxId = null;

    win.querySelector('.qrtx-text-input').value = '';
    
    // reset file
    wState.uploadedFileBase64 = null;
    wState.uploadedFileName = '';
    wState.uploadedFileSize = 0;
    win.querySelector('.qrtx-file-input').value = '';
    win.querySelector('.qrtx-file-banner').style.display = 'none';
    win.querySelector('.qrtx-drop-zone').style.display = 'flex';

    const b64Chk = win.querySelector('.qrtx-base64-checkbox');
    b64Chk.checked = false;
    b64Chk.disabled = false;

    win.querySelector('.qrtx-speed-slider').value = 300;
    win.querySelector('.qrtx-chunk-slider').value = 250;

    win.querySelector('.qrtx-speed-label').innerText = '300ms';
    win.querySelector('.qrtx-chunk-label').innerText = '250 chars';

    win.querySelector('.qrtx-stat-tx-id').innerText = '----';
    win.querySelector('.qrtx-stat-total-frames').innerText = '0';
    win.querySelector('.qrtx-stat-speed').innerText = '0 Hz';
    win.querySelector('.qrtx-stat-mode').innerText = 'Plain Text';

    win.querySelector('.qrtx-prog-frame').innerText = '0';
    win.querySelector('.qrtx-prog-total').innerText = '0';
    win.querySelector('.qrtx-prog-percent').innerText = '0%';
    win.querySelector('.qrtx-prog-fill').style.width = '0%';

    win.querySelector('.qrtx-alert-box').style.display = 'none';
    win.querySelector('.qrtx-status-text').innerText = 'Idle';
    win.querySelector('.qrtx-statusbar').innerText = 'Ready';

    wState.qrEngine.clear();
  };
}

