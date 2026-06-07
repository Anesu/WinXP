// ===== TEXT DIFF APP =====

function initTextDiffApp(winId, el) {}

function diffCompare() {
  const el = findWinEl('textdiff');
  if (!el) return;
  const textA = el.querySelector('#diff-text-a').value;
  const textB = el.querySelector('#diff-text-b').value;
  if (!textA && !textB) { el.querySelector('#diff-status').textContent = 'Both fields are empty — nothing to compare'; return; }
  const wordsA = textA.split(/(\s+)/);
  const wordsB = textB.split(/(\s+)/);
  const result = computeDiff(wordsA, wordsB);
  const resultEl = el.querySelector('#diff-result');
  const container = el.querySelector('#diff-result-container');
  let html = '';
  result.forEach(part => {
    if (part.type === 'added') html += '<span class="diff-added">' + escapeHtml(part.text) + '</span>';
    else if (part.type === 'removed') html += '<span class="diff-removed">' + escapeHtml(part.text) + '</span>';
    else html += '<span class="diff-unchanged">' + escapeHtml(part.text) + '</span>';
  });
  resultEl.innerHTML = html || '<span class="diff-unchanged">(no differences found)</span>';
  container.style.display = 'flex';
  const added = result.filter(r => r.type === 'added').length;
  const removed = result.filter(r => r.type === 'removed').length;
  el.querySelector('#diff-status').textContent = (added + removed) + ' difference(s) found — ' + added + ' addition(s), ' + removed + ' removal(s)';
}

function computeDiff(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i >= a.length) { result.push({ type: 'added', text: b.slice(j).join('') }); break; }
    if (j >= b.length) { result.push({ type: 'removed', text: a.slice(i).join('') }); break; }
    if (a[i] === b[j]) {
      let sameText = '';
      while (i < a.length && j < b.length && a[i] === b[j]) { sameText += a[i]; i++; j++; }
      result.push({ type: 'unchanged', text: sameText });
    } else {
      let matchFound = false;
      const lookAhead = 8;
      for (let k = 1; k <= lookAhead && j + k < b.length; k++) {
        if (a[i] === b[j + k]) { result.push({ type: 'added', text: b.slice(j, j + k).join('') }); j += k; matchFound = true; break; }
      }
      if (!matchFound) {
        for (let k = 1; k <= lookAhead && i + k < a.length; k++) {
          if (b[j] === a[i + k]) { result.push({ type: 'removed', text: a.slice(i, i + k).join('') }); i += k; matchFound = true; break; }
        }
      }
      if (!matchFound) { result.push({ type: 'removed', text: a[i] }); result.push({ type: 'added', text: b[j] }); i++; j++; }
    }
  }
  return result;
}

function diffClear() {
  const el = findWinEl('textdiff');
  if (!el) return;
  el.querySelector('#diff-text-a').value = '';
  el.querySelector('#diff-text-b').value = '';
  el.querySelector('#diff-result-container').style.display = 'none';
  el.querySelector('#diff-status').textContent = 'Ready — paste two versions and click Compare';
}

function diffSwap() {
  const el = findWinEl('textdiff');
  if (!el) return;
  const a = el.querySelector('#diff-text-a').value;
  const b = el.querySelector('#diff-text-b').value;
  el.querySelector('#diff-text-a').value = b;
  el.querySelector('#diff-text-b').value = a;
}
