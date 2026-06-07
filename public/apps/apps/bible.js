// ===== BIBLE BOOKS DATA =====
const BIBLE_BOOKS = [
  { abbr: 'GEN', name: 'Genesis', ch: 50, ot: true },
  { abbr: 'EXO', name: 'Exodus', ch: 40, ot: true },
  { abbr: 'LEV', name: 'Leviticus', ch: 27, ot: true },
  { abbr: 'NUM', name: 'Numbers', ch: 36, ot: true },
  { abbr: 'DEU', name: 'Deuteronomy', ch: 34, ot: true },
  { abbr: 'JOS', name: 'Joshua', ch: 24, ot: true },
  { abbr: 'JDG', name: 'Judges', ch: 21, ot: true },
  { abbr: 'RUT', name: 'Ruth', ch: 4, ot: true },
  { abbr: '1SA', name: '1 Samuel', ch: 31, ot: true },
  { abbr: '2SA', name: '2 Samuel', ch: 24, ot: true },
  { abbr: '1KI', name: '1 Kings', ch: 22, ot: true },
  { abbr: '2KI', name: '2 Kings', ch: 25, ot: true },
  { abbr: '1CH', name: '1 Chronicles', ch: 29, ot: true },
  { abbr: '2CH', name: '2 Chronicles', ch: 36, ot: true },
  { abbr: 'EZR', name: 'Ezra', ch: 10, ot: true },
  { abbr: 'NEH', name: 'Nehemiah', ch: 13, ot: true },
  { abbr: 'EST', name: 'Esther', ch: 10, ot: true },
  { abbr: 'JOB', name: 'Job', ch: 42, ot: true },
  { abbr: 'PSA', name: 'Psalms', ch: 150, ot: true },
  { abbr: 'PRO', name: 'Proverbs', ch: 31, ot: true },
  { abbr: 'ECC', name: 'Ecclesiastes', ch: 12, ot: true },
  { abbr: 'SNG', name: 'Song of Solomon', ch: 8, ot: true },
  { abbr: 'ISA', name: 'Isaiah', ch: 66, ot: true },
  { abbr: 'JER', name: 'Jeremiah', ch: 52, ot: true },
  { abbr: 'LAM', name: 'Lamentations', ch: 5, ot: true },
  { abbr: 'EZK', name: 'Ezekiel', ch: 48, ot: true },
  { abbr: 'DAN', name: 'Daniel', ch: 12, ot: true },
  { abbr: 'HOS', name: 'Hosea', ch: 14, ot: true },
  { abbr: 'JOL', name: 'Joel', ch: 3, ot: true },
  { abbr: 'AMO', name: 'Amos', ch: 9, ot: true },
  { abbr: 'OBA', name: 'Obadiah', ch: 1, ot: true },
  { abbr: 'JON', name: 'Jonah', ch: 4, ot: true },
  { abbr: 'MIC', name: 'Micah', ch: 7, ot: true },
  { abbr: 'NAM', name: 'Nahum', ch: 3, ot: true },
  { abbr: 'HAB', name: 'Habakkuk', ch: 3, ot: true },
  { abbr: 'ZEP', name: 'Zephaniah', ch: 3, ot: true },
  { abbr: 'HAG', name: 'Haggai', ch: 2, ot: true },
  { abbr: 'ZEC', name: 'Zechariah', ch: 14, ot: true },
  { abbr: 'MAL', name: 'Malachi', ch: 4, ot: true },
  { abbr: 'MAT', name: 'Matthew', ch: 28, ot: false },
  { abbr: 'MRK', name: 'Mark', ch: 16, ot: false },
  { abbr: 'LUK', name: 'Luke', ch: 24, ot: false },
  { abbr: 'JHN', name: 'John', ch: 21, ot: false },
  { abbr: 'ACT', name: 'Acts', ch: 28, ot: false },
  { abbr: 'ROM', name: 'Romans', ch: 16, ot: false },
  { abbr: '1CO', name: '1 Corinthians', ch: 16, ot: false },
  { abbr: '2CO', name: '2 Corinthians', ch: 13, ot: false },
  { abbr: 'GAL', name: 'Galatians', ch: 6, ot: false },
  { abbr: 'EPH', name: 'Ephesians', ch: 6, ot: false },
  { abbr: 'PHP', name: 'Philippians', ch: 4, ot: false },
  { abbr: 'COL', name: 'Colossians', ch: 4, ot: false },
  { abbr: '1TH', name: '1 Thessalonians', ch: 5, ot: false },
  { abbr: '2TH', name: '2 Thessalonians', ch: 3, ot: false },
  { abbr: '1TI', name: '1 Timothy', ch: 6, ot: false },
  { abbr: '2TI', name: '2 Timothy', ch: 4, ot: false },
  { abbr: 'TIT', name: 'Titus', ch: 3, ot: false },
  { abbr: 'PHM', name: 'Philemon', ch: 1, ot: false },
  { abbr: 'HEB', name: 'Hebrews', ch: 13, ot: false },
  { abbr: 'JAS', name: 'James', ch: 5, ot: false },
  { abbr: '1PE', name: '1 Peter', ch: 5, ot: false },
  { abbr: '2PE', name: '2 Peter', ch: 3, ot: false },
  { abbr: '1JN', name: '1 John', ch: 5, ot: false },
  { abbr: '2JN', name: '2 John', ch: 1, ot: false },
  { abbr: '3JN', name: '3 John', ch: 1, ot: false },
  { abbr: 'JUD', name: 'Jude', ch: 1, ot: false },
  { abbr: 'REV', name: 'Revelation', ch: 22, ot: false },
];

// ===== BIBLE APP =====
function initBibleApp(winId, el) {
  state.windows[winId].appState = { bookIdx: 42, chapter: 1, translation: 'NIV', bookmarkView: false };
  renderBibleSidebar(winId);
  renderBibleBookSelect(winId);
  bibleLoadChapter(winId);
}

function renderBibleSidebar(winIdOrEl) {
  const { state: bibleState, el } = getAppStateAndEl(winIdOrEl);
  if (!bibleState || !el) return;
  const otList = el.querySelector('#bible-ot-list');
  const ntList = el.querySelector('#bible-nt-list');
  if (!otList || !ntList) return;
  let otHtml = '', ntHtml = '';
  BIBLE_BOOKS.forEach((b, i) => {
    const active = i === bibleState.bookIdx ? ' active' : '';
    const item = '<div class="bible-book-item' + active + '" onclick="bibleSelectBook(' + i + ')">' + b.name + '</div>';
    if (b.ot) otHtml += item; else ntHtml += item;
  });
  otList.innerHTML = otHtml;
  ntList.innerHTML = ntHtml;
}

function renderBibleBookSelect(winIdOrEl) {
  const { state: bibleState, el } = getAppStateAndEl(winIdOrEl);
  if (!bibleState || !el) return;
  const sel = el.querySelector('#bible-book');
  if (!sel) return;
  let html = '';
  html += '<optgroup label="Old Testament">';
  BIBLE_BOOKS.forEach((b, i) => {
    if (!b.ot) return;
    html += '<option value="' + i + '"' + (i === bibleState.bookIdx ? ' selected' : '') + '>' + b.name + '</option>';
  });
  html += '</optgroup><optgroup label="New Testament">';
  BIBLE_BOOKS.forEach((b, i) => {
    if (b.ot) return;
    html += '<option value="' + i + '"' + (i === bibleState.bookIdx ? ' selected' : '') + '>' + b.name + '</option>';
  });
  html += '</optgroup>';
  sel.innerHTML = html;
  el.querySelector('#bible-translation').value = bibleState.translation;
}

function bibleSelectBook(idx) {
  const { state: bibleState, el, winId } = getAppStateAndEl();
  if (!bibleState) return;
  bibleState.bookIdx = idx;
  bibleState.chapter = 1;
  bibleState.bookmarkView = false;
  if (!el) return;
  renderBibleSidebar(winId);
  renderBibleBookSelect(winId);
  bibleLoadChapter(winId);
}

function bibleChangeBook() {
  const { state: bibleState, el, winId } = getAppStateAndEl();
  if (!bibleState || !el) return;
  bibleState.bookIdx = parseInt(el.querySelector('#bible-book').value);
  bibleState.chapter = 1;
  bibleState.bookmarkView = false;
  renderBibleSidebar(winId);
  bibleLoadChapter(winId);
}

function bibleChangeTranslation() {
  const { state: bibleState, el, winId } = getAppStateAndEl();
  if (!bibleState || !el) return;
  bibleState.translation = el.querySelector('#bible-translation').value;
  bibleLoadChapter(winId);
}

function biblePrevChapter() {
  const { state: bibleState, el, winId } = getAppStateAndEl();
  if (!bibleState) return;
  if (bibleState.chapter > 1) { bibleState.chapter--; }
  else {
    if (bibleState.bookIdx > 0) { bibleState.bookIdx--; bibleState.chapter = BIBLE_BOOKS[bibleState.bookIdx].ch; }
    else return;
  }
  bibleState.bookmarkView = false;
  if (!el) return;
  renderBibleSidebar(winId);
  renderBibleBookSelect(winId);
  bibleLoadChapter(winId);
}

// Custom handler for search box trigger
function bibleSearchKey(e) {
  if (e.key === 'Enter') bibleSearch();
}

function bibleNextChapter() {
  const { state: bibleState, el, winId } = getAppStateAndEl();
  if (!bibleState) return;
  const book = BIBLE_BOOKS[bibleState.bookIdx];
  if (bibleState.chapter < book.ch) { bibleState.chapter++; }
  else {
    if (bibleState.bookIdx < BIBLE_BOOKS.length - 1) { bibleState.bookIdx++; bibleState.chapter = 1; }
    else return;
  }
  bibleState.bookmarkView = false;
  if (!el) return;
  renderBibleSidebar(winId);
  renderBibleBookSelect(winId);
  bibleLoadChapter(winId);
}

function bibleGoToBook() {
  const { state: bibleState, el, winId } = getAppStateAndEl();
  if (!bibleState) return;
  const book = BIBLE_BOOKS[bibleState.bookIdx];
  const ch = prompt('Go to ' + book.name + ' chapter (1-' + book.ch + '):', bibleState.chapter);
  if (!ch) return;
  const n = parseInt(ch);
  if (isNaN(n) || n < 1 || n > book.ch) { alert('Invalid chapter. ' + book.name + ' has ' + book.ch + ' chapters.'); return; }
  bibleState.chapter = n;
  bibleState.bookmarkView = false;
  if (!el) return;
  renderBibleSidebar(winId);
  renderBibleBookSelect(winId);
  bibleLoadChapter(winId);
}

function bibleLoadChapter(winIdOrEl) {
  const { state: bibleState, el, winId } = getAppStateAndEl(winIdOrEl);
  if (!bibleState || !el) return;
  const book = BIBLE_BOOKS[bibleState.bookIdx];
  const cacheKey = bibleState.translation + ':' + book.abbr + '.' + bibleState.chapter;
  el.querySelector('#bible-chapter-label').textContent = 'Chapter ' + bibleState.chapter;
  el.querySelector('#bible-passage-header').innerHTML = '<b>' + book.name + ' ' + bibleState.chapter + '</b> <span style="font-size:10px;color:#808080;">(' + bibleState.translation + ')</span>';
  el.querySelector('#bible-status').textContent = 'Loading ' + book.name + ' ' + bibleState.chapter + '...';

  if (bibleCache[cacheKey]) {
    bibleRenderPassage(winId, bibleCache[cacheKey], book);
    return;
  }

  const passage = el.querySelector('#bible-passage');
  passage.innerHTML = '<div class="bible-placeholder">⏳ Loading ' + book.name + ' ' + bibleState.chapter + '...</div>';

  const bookNum = bibleState.bookIdx + 1;
  fetch('https://bolls.life/get-chapter/' + bibleState.translation + '/' + bookNum + '/' + bibleState.chapter + '/')
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        bibleCache[cacheKey] = data;
        saveBibleCache();
        bibleRenderPassage(winId, data, book);
      } else {
        passage.innerHTML = '<div class="bible-placeholder">⚠️ Could not load passage. Check your internet connection.</div>';
        el.querySelector('#bible-status').textContent = 'Error loading passage';
      }
    })
    .catch(() => {
      passage.innerHTML = '<div class="bible-placeholder">⚠️ Network error. This app requires internet to fetch Bible text on first access. Previously read chapters are available offline.</div>';
      el.querySelector('#bible-status').textContent = 'Network error';
    });
}

function bibleRenderPassage(winIdOrEl, data, book) {
  const { state: bibleState, el } = getAppStateAndEl(winIdOrEl);
  if (!bibleState || !el) return;
  const passage = el.querySelector('#bible-passage');
  const bookAbbr = BIBLE_BOOKS[bibleState.bookIdx].abbr;
  let html = '';
  data.forEach(v => {
    const verseNum = v.verse;
    const key = bookAbbr + '.' + bibleState.chapter + '.' + verseNum;
    const isBookmarked = bibleBookmarkStore && bibleBookmarkStore[key];
    const bmClass = isBookmarked ? ' bible-bookmarked' : '';
    const verseText = (v.text || '').replace(/<br\/>/g, '<br>');
    html += '<span class="bible-verse' + bmClass + '" id="bv-' + verseNum + '" onclick="bibleToggleVerseBookmark(event,\'' + bookAbbr + '\',' + bibleState.chapter + ',' + verseNum + ')" title="Click to ' + (isBookmarked ? 'remove' : 'add') + ' bookmark">';
    html += '<sup>' + verseNum + '</sup>' + verseText + '</span> ';
  });
  passage.innerHTML = html;
  el.querySelector('#bible-status').textContent = book.name + ' ' + bibleState.chapter + ' — ' + data.length + ' verses (' + bibleState.translation + ')';
  el.querySelector('#bible-passage-header').innerHTML = '<b>' + book.name + ' ' + bibleState.chapter + '</b> <span style="font-size:10px;color:#808080;">(' + bibleState.translation + ')</span>';
}

function bibleToggleVerseBookmark(e, bookId, chapter, verse) {
  e.stopPropagation();
  const key = bookId + '.' + chapter + '.' + verse;
  if (bibleBookmarkStore[key]) {
    delete bibleBookmarkStore[key];
  } else {
    const book = BIBLE_BOOKS.find(b => b.abbr === bookId);
    bibleBookmarkStore[key] = { book: book ? book.name : bookId, chapter, verse, date: Date.now() };
  }
  const { el } = getAppStateAndEl();
  if (el) {
    const ve = el.querySelector('#bv-' + verse);
    if (ve) ve.classList.toggle('bible-bookmarked', !!bibleBookmarkStore[key]);
  }
}

function bibleToggleBookmarks() {
  const { state: bibleState, el, winId } = getAppStateAndEl();
  if (!bibleState || !el) return;
  bibleState.bookmarkView = !bibleState.bookmarkView;
  if (bibleState.bookmarkView) {
    bibleRenderBookmarks(winId);
  } else {
    bibleLoadChapter(winId);
  }
}

// Custom handler for search box trigger
function bibleSearchKey(e) {
  if (e.key === 'Enter') bibleSearch();
}

function bibleRenderBookmarks(winIdOrEl) {
  const { state: bibleState, el } = getAppStateAndEl(winIdOrEl);
  if (!bibleState || !el) return;
  const passage = el.querySelector('#bible-passage');
  const bookmarks = bibleBookmarkStore || {};
  const keys = Object.keys(bookmarks);
  if (keys.length === 0) {
    passage.innerHTML = '<div class="bible-placeholder">★ No bookmarks yet. Click a verse number to bookmark it.</div>';
    el.querySelector('#bible-passage-header').textContent = 'Bookmarks';
    el.querySelector('#bible-status').textContent = '0 bookmarks';
    return;
  }
  keys.sort((a, b) => {
    const ai = BIBLE_BOOKS.findIndex(bk => bk.abbr === a.split('.')[0]);
    const bi = BIBLE_BOOKS.findIndex(bk => bk.abbr === b.split('.')[0]);
    if (ai !== bi) return ai - bi;
    const [ac, av] = a.split('.').slice(1).map(Number);
    const [bc, bv] = b.split('.').slice(1).map(Number);
    return ac !== bc ? ac - bc : av - bv;
  });
  let html = '';
  keys.forEach(key => {
    const bm = bookmarks[key];
    html += '<div style="padding:4px 0;border-bottom:1px solid #e0e0e0;cursor:pointer;" onclick="bibleGoBookmark(\'' + key + '\')">';
    html += '<span style="color:#000080;font-weight:bold;">★ ' + bm.book + ' ' + bm.chapter + ':' + bm.verse + '</span>';
    html += '<span style="color:#808080;font-size:10px;margin-left:8px;">' + formatTime(bm.date) + '</span>';
    html += '<button class="bible-bm-del" onclick="event.stopPropagation();bibleRemoveBookmark(\'' + key + '\')" style="float:right;background:none;border:none;color:#cc0000;cursor:pointer;font-size:11px;">✕</button>';
    html += '</div>';
  });
  passage.innerHTML = html;
  el.querySelector('#bible-passage-header').textContent = 'Bookmarks (' + keys.length + ')';
  el.querySelector('#bible-status').textContent = keys.length + ' bookmark(s)';
}

function bibleGoBookmark(key) {
  const [bookAbbr, ch, vs] = key.split('.');
  const idx = BIBLE_BOOKS.findIndex(b => b.abbr === bookAbbr);
  if (idx === -1) return;
  const { state: bibleState, el, winId } = getAppStateAndEl();
  if (!bibleState) return;
  bibleState.bookIdx = idx;
  bibleState.chapter = parseInt(ch);
  bibleState.bookmarkView = false;
  if (!el) return;
  renderBibleSidebar(winId);
  renderBibleBookSelect(winId);
  bibleLoadChapter(winId);
}

function bibleRemoveBookmark(key) {
  if (!bibleBookmarkStore) return;
  delete bibleBookmarkStore[key];
  const { el, winId } = getAppStateAndEl();
  if (el) bibleRenderBookmarks(winId);
}

function bibleSearch() {
  const { state: bibleState, el, winId } = getAppStateAndEl();
  if (!bibleState || !el) return;
  const q = (el.querySelector('#bible-search-input')?.value || '').trim();
  if (!q) return;
  bibleState.bookmarkView = false;
  el.querySelector('#bible-status').textContent = 'Searching...';
  const bookNum = bibleState.bookIdx + 1;
  fetch('https://bolls.life/get-chapter/' + bibleState.translation + '/' + bookNum + '/' + bibleState.chapter + '/?search=' + encodeURIComponent(q))
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const matching = data.filter(v => (v.text || '').toLowerCase().includes(q.toLowerCase()));
        if (matching.length > 0) {
          bibleRenderPassage(winId, matching, BIBLE_BOOKS[bibleState.bookIdx]);
          el.querySelector('#bible-passage-header').textContent = 'Search: "' + q + '" (' + matching.length + ' match' + (matching.length !== 1 ? 'es' : '') + ')';
        } else {
          tryRefLookup(winId, q);
        }
      } else {
        tryRefLookup(winId, q);
      }
    })
    .catch(() => {
      el.querySelector('#bible-status').textContent = 'Search failed — check internet connection';
    });
}

function tryRefLookup(winIdOrEl, q) {
  const { state: bibleState, el, winId } = getAppStateAndEl(winIdOrEl);
  if (!bibleState || !el) return;
  const book = BIBLE_BOOKS[bibleState.bookIdx];
  el.querySelector('#bible-status').textContent = 'Searching all chapters of ' + book.name + '...';
  const refMatch = q.match(/^([a-zA-Z\s]+)\s+(\d+):?(\d*)$/i);
  if (refMatch) {
    const refBook = BIBLE_BOOKS.find(b => b.name.toLowerCase().startsWith(refMatch[1].toLowerCase()));
    if (refBook) {
      const refIdx = BIBLE_BOOKS.indexOf(refBook);
      bibleState.bookIdx = refIdx;
      bibleState.chapter = parseInt(refMatch[2]) || 1;
      renderBibleSidebar(winId);
      renderBibleBookSelect(winId);
      bibleLoadChapter(winId);
      return;
    }
  }
  el.querySelector('#bible-passage').innerHTML = '<div class="bible-placeholder">No results found for "' + escapeHtml(q) + '".<br><br>Try a Bible reference like "John 3:16" or browse by book.</div>';
  el.querySelector('#bible-status').textContent = 'No results';
}
