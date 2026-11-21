/* KJV + Apocrypha/Pseudepigrapha Reader
   Inspired by Aristotle Reader
   Core data: midvash/bible-data (public domain KJV)
*/

let bible = null;
let currentBook = null;
let currentChapter = 1;
let bookmarks = JSON.parse(localStorage.getItem('kjv-bookmarks') || '[]');
let isExtraBook = false;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- Extra books with history (from your screenshot) ---------- */
let EXTRA_BOOKS = [];

/* ---------- Init ---------- */
async function init() {
  showLoading(true);
  try {
    const res = await fetch('data/kjv.json');
    if (!res.ok) throw new Error('Failed to load Bible data');
    bible = await res.json();
    applyCanonicalPunctuationCorrections(bible);
    const extraRes = await fetch('data/extra-books.json');
    if (!extraRes.ok) throw new Error('Failed to load extra-book catalog');
    const extraCatalog = await extraRes.json();
    EXTRA_BOOKS = Array.isArray(extraCatalog.books) ? extraCatalog.books : [];
    buildBookList();
    loadBook('Gen', 1);
    setupEventListeners();
    applyTheme(localStorage.getItem('kjv-theme') || 'light');
  } catch (err) {
    console.error(err);
    $('.main').innerHTML = `<div class="empty">Could not load Bible data.<br>Make sure data/kjv.json is present.</div>`;
  } finally {
    showLoading(false);
  }
}

function showLoading(show) {
  const el = $('#loading');
  if (el) el.style.display = show ? 'block' : 'none';
}


/* ---------- Verified punctuation normalization ---------- */
/* Correct only the three exact whitespace defects found by the 2026-11-21
   source audit. The original wording and punctuation marks are preserved. */
function applyCanonicalPunctuationCorrections(data) {
  const corrections = [
    { book: 'Num', chapter: 15, verse: 39,
      source: 'And it shall be unto you for a fringe, that ye may look upon it, and remember all the commandments of the Lord, and do them ; and that ye seek not after your own heart and your own eyes, after which ye use to go a whoring:',
      corrected: 'And it shall be unto you for a fringe, that ye may look upon it, and remember all the commandments of the Lord, and do them; and that ye seek not after your own heart and your own eyes, after which ye use to go a whoring:' },
    { book: 'Eccl', chapter: 7, verse: 16,
      source: 'Be not righteous over much; neither make thyself over wise: why shouldest thou destroy thyself ?',
      corrected: 'Be not righteous over much; neither make thyself over wise: why shouldest thou destroy thyself?' },
    { book: 'Isa', chapter: 2, verse: 22,
      source: 'Cease ye from man, whose breath is in his nostrils: for wherein is he to be accounted of ?',
      corrected: 'Cease ye from man, whose breath is in his nostrils: for wherein is he to be accounted of?' }
  ];

  for (const item of corrections) {
    const book = data.books.find(entry => entry.book === item.book);
    const chapter = book?.chapters.find(entry => entry.chapter === item.chapter);
    const verse = chapter?.verses.find(entry => entry.number === item.verse);
    if (!verse || verse.text !== item.source) {
      throw new Error(`Canonical text mismatch at ${item.book} ${item.chapter}:${item.verse}; refusing automatic correction.`);
    }
    verse.text = item.corrected;
  }
}

/* ---------- Book list ---------- */
function buildBookList() {
  const ot = $('#ot-list');
  const nt = $('#nt-list');
  const extra = $('#extra-list');
  ot.innerHTML = '';
  nt.innerHTML = '';
  extra.innerHTML = '';

  // Standard 66 books
  bible.books.forEach(book => {
    const li = document.createElement('li');
    li.textContent = book.englishName;
    li.dataset.book = book.book;
    li.dataset.type = 'canon';
    li.addEventListener('click', () => {
      isExtraBook = false;
      loadBook(book.book, 1);
      closeSidebarOnMobile();
    });
    if (book.testament === 'OT') ot.appendChild(li);
    else nt.appendChild(li);
  });

  // Extra books: preserve the reader's requested Apocrypha and Pseudepigrapha order.
  const groupLabels = {
    apocrypha: 'Apocrypha',
    pseudepigrapha: 'Pseudepigrapha',
    additional: 'Additional related works'
  };
  const groupOrder = ['apocrypha', 'pseudepigrapha', 'additional'];
  const sortedExtraBooks = [...EXTRA_BOOKS].sort((a, b) => {
    const groupDifference = groupOrder.indexOf(a.navigationGroup || 'additional') -
      groupOrder.indexOf(b.navigationGroup || 'additional');
    return groupDifference || (a.navigationOrder || 0) - (b.navigationOrder || 0);
  });
  let activeGroup = '';
  sortedExtraBooks.forEach(book => {
    const group = groupLabels[book.navigationGroup] ? book.navigationGroup : 'additional';
    if (group !== activeGroup) {
      const heading = document.createElement('li');
      heading.className = 'extra-section-heading';
      heading.textContent = groupLabels[group];
      heading.setAttribute('aria-hidden', 'true');
      extra.appendChild(heading);
      activeGroup = group;
    }
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.className = 'extra-book-name';
    name.textContent = book.name;
    const category = document.createElement('span');
    category.className = 'book-category';
    category.textContent = book.category || 'Related literature';
    li.append(name, category);
    li.dataset.book = book.id;
    li.dataset.type = 'extra';
    li.classList.add('extra-book', group);
    li.addEventListener('click', () => {
      isExtraBook = true;
      loadExtraBook(book);
      closeSidebarOnMobile();
    });
    extra.appendChild(li);
  });
}

/* ---------- Load standard book ---------- */
function loadBook(bookCode, chapter = 1) {
  currentBook = bible.books.find(b => b.book === bookCode);
  if (!currentBook) return;

  isExtraBook = false;
  currentChapter = Math.max(1, Math.min(chapter, currentBook.chapters.length));

  $$('.book-list li').forEach(li => {
    li.classList.toggle('active', li.dataset.book === bookCode);
  });

  // Hide history box
  const hist = $('#history-box');
  if (hist) hist.style.display = 'none';

  renderChapter();
  updateURL();
  updateBookmarkButton();
}

/* ---------- Load extra book (history + placeholder) ---------- */
function loadExtraBook(book) {
  currentBook = null;
  isExtraBook = true;

  $$('.book-list li').forEach(li => {
    li.classList.toggle('active', li.dataset.book === book.id);
  });

  $('.book-title').textContent = book.name;
  $('.chapter-nav').innerHTML = '';
  $('.verses').innerHTML = '';

  // Show history
  let hist = $('#history-box');
  if (!hist) {
    hist = document.createElement('div');
    hist.id = 'history-box';
    hist.className = 'history-box';
    $('.main').insertBefore(hist, $('.chapter-nav'));
  }
  hist.style.display = 'block';
  hist.replaceChildren();
  const addHistoryField = (label, value, className = '') => {
    if (!value) return;
    const section = document.createElement('p');
    if (className) section.className = className;
    const strong = document.createElement('strong');
    strong.textContent = label + ': ';
    section.append(strong, document.createTextNode(value));
    hist.appendChild(section);
  };
  const label = document.createElement('div');
  label.className = 'history-label';
  label.textContent = book.category || 'Related historical literature';
  hist.appendChild(label);
  addHistoryField('Tradition / reception', book.tradition);
  addHistoryField('Approximate period', book.period);
  addHistoryField('Composition and attribution', book.composition);
  addHistoryField('Language', book.language);
  addHistoryField('Manuscripts and witnesses', book.manuscripts);
  addHistoryField('Contents', book.contents);
  addHistoryField('Historical notes', book.history);
  addHistoryField('Canonical status', book.canonicalStatus);
  addHistoryField('Text status', book.translationStatus || 'Metadata only; verse text has not been added.');
  if (Array.isArray(book.sources) && book.sources.length) {
    const sourceSection = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Historical / edition references: ';
    sourceSection.appendChild(strong);
    sourceSection.appendChild(document.createTextNode(book.sources.join('; ')));
    hist.appendChild(sourceSection);
  }

  updateURL();
  updateBookmarkButton();
}

/* ---------- Render chapter (standard books) ---------- */
function renderChapter() {
  if (!currentBook) return;
  const ch = currentBook.chapters[currentChapter - 1];
  if (!ch) return;

  $('.book-title').textContent = `${currentBook.englishName} ${currentChapter}`;
  renderChapterNav();
  renderVerses(ch.verses);
}

function renderChapterNav() {
  const nav = $('.chapter-nav');
  nav.innerHTML = '';
  currentBook.chapters.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.textContent = i + 1;
    btn.classList.toggle('active', i + 1 === currentChapter);
    btn.addEventListener('click', () => {
      currentChapter = i + 1;
      renderChapter();
      updateURL();
    });
    nav.appendChild(btn);
  });
}

function renderVerses(verses) {
  const container = $('.verses');
  container.innerHTML = '';

  verses.forEach(v => {
    const div = document.createElement('div');
    div.className = 'verse';
    div.id = `v${v.number}`;
    div.dataset.verse = v.number;

    const num = document.createElement('span');
    num.className = 'verse-number';
    num.textContent = v.number;

    const text = document.createElement('span');
    text.className = 'verse-text';
    text.innerHTML = makeWordsClickable(v.text);

    div.appendChild(num);
    div.appendChild(text);
    container.appendChild(div);
  });
}

function makeWordsClickable(text) {
  return text.replace(/([A-Za-z']+)/g, '<span class="word">$1</span>');
}

/* ---------- Search ---------- */
function performSearch(query) {
  query = query.trim().toLowerCase();
  if (query.length < 2) {
    $('.search-results').innerHTML = '<p class="empty">Enter at least 2 characters.</p>';
    return;
  }

  const results = [];
  const maxResults = 80;

  for (const book of bible.books) {
    for (const ch of book.chapters) {
      for (const v of ch.verses) {
        if (v.text.toLowerCase().includes(query)) {
          results.push({
            book: book.book,
            englishName: book.englishName,
            chapter: ch.chapter,
            verse: v.number,
            text: v.text
          });
          if (results.length >= maxResults) break;
        }
      }
      if (results.length >= maxResults) break;
    }
    if (results.length >= maxResults) break;
  }

  renderSearchResults(results, query);
}

function renderSearchResults(results, query) {
  const container = $('.search-results');
  if (results.length === 0) {
    container.innerHTML = '<p class="empty">No results found in the 66-book KJV.</p>';
    return;
  }

  const re = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  container.innerHTML = results.map(r => {
    const highlighted = r.text.replace(re, '<mark>$1</mark>');
    return `
      <div class="result-item" data-book="${r.book}" data-chapter="${r.chapter}" data-verse="${r.verse}">
        <div class="result-ref">${r.englishName} ${r.chapter}:${r.verse}</div>
        <div class="result-text">${highlighted}</div>
      </div>
    `;
  }).join('');

  $$('.result-item').forEach(el => {
    el.addEventListener('click', () => {
      const book = el.dataset.book;
      const chapter = parseInt(el.dataset.chapter, 10);
      const verse = parseInt(el.dataset.verse, 10);
      closeSearch();
      loadBook(book, chapter);
      setTimeout(() => {
        const target = $(`#v${verse}`);
        if (target) {
          target.classList.add('highlight');
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => target.classList.remove('highlight'), 2500);
        }
      }, 100);
    });
  });
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ---------- Dictionary / word lookup ---------- */
function showWordLookup(word) {
  const modal = $('#dict-modal');
  const clean = word.replace(/[^A-Za-z']/g, '');
  $('#dict-word').textContent = clean;
  $('#dict-body').innerHTML = `
    <p>Selected word from the King James text.</p>
    <p style="font-size:0.9rem;color:var(--text-muted)">
      A full lexicon (Strong’s numbers, Thayer, etc.) can be added here later.
      This click-to-focus behavior is inspired by the Aristotle Reader.
    </p>
  `;
  modal.classList.add('open');
}

/* ---------- Bookmarks ---------- */
function toggleBookmark() {
  if (isExtraBook || !currentBook) return;
  const ref = `${currentBook.englishName} ${currentChapter}`;
  const existing = bookmarks.findIndex(b => b.ref === ref);
  if (existing >= 0) {
    bookmarks.splice(existing, 1);
  } else {
    bookmarks.unshift({
      ref,
      book: currentBook.book,
      chapter: currentChapter,
      time: Date.now()
    });
  }
  localStorage.setItem('kjv-bookmarks', JSON.stringify(bookmarks));
  renderBookmarks();
  updateBookmarkButton();
}

function renderBookmarks() {
  const list = $('#bookmarks-list');
  if (bookmarks.length === 0) {
    list.innerHTML = '<p class="empty" style="padding:1rem 0">No bookmarks yet.</p>';
    return;
  }
  list.innerHTML = bookmarks.map(b => `
    <div class="bookmark-item" data-book="${b.book}" data-chapter="${b.chapter}">
      ${b.ref}
    </div>
  `).join('');

  $$('.bookmark-item').forEach(el => {
    el.addEventListener('click', () => {
      loadBook(el.dataset.book, parseInt(el.dataset.chapter, 10));
      closeBookmarks();
    });
  });
}

function updateBookmarkButton() {
  const btn = $('#btn-bookmark');
  if (isExtraBook || !currentBook) {
    btn.textContent = '☆ Bookmark';
    btn.classList.remove('active');
    btn.disabled = true;
    return;
  }
  btn.disabled = false;
  const ref = `${currentBook.englishName} ${currentChapter}`;
  if (bookmarks.some(b => b.ref === ref)) {
    btn.textContent = '★ Bookmarked';
    btn.classList.add('active');
  } else {
    btn.textContent = '☆ Bookmark';
    btn.classList.remove('active');
  }
}

/* ---------- Theme ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('kjv-theme', theme);
  $('#btn-theme').textContent = theme === 'dark' ? '☀ Light' : '☾ Dark';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ---------- UI helpers ---------- */
function openSearch() {
  $('#search-panel').classList.add('open');
  $('#search-input').focus();
  $('#search-input').value = '';
  $('.search-results').innerHTML = '';
}

function closeSearch() {
  $('#search-panel').classList.remove('open');
}

function openBookmarks() {
  renderBookmarks();
  $('#bookmarks-panel').classList.add('open');
}

function closeBookmarks() {
  $('#bookmarks-panel').classList.remove('open');
}

function toggleSidebar() {
  $('#sidebar').classList.toggle('open');
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 800) {
    $('#sidebar').classList.remove('open');
  }
}

function updateURL() {
  if (isExtraBook) {
    history.replaceState(null, '', '#extra');
    return;
  }
  if (!currentBook) return;
  const hash = `#${currentBook.book}.${currentChapter}`;
  history.replaceState(null, '', hash);
}

function loadFromURL() {
  const hash = location.hash.slice(1);
  if (!hash || hash === 'extra') return;
  const [book, ch] = hash.split('.');
  if (book && ch) {
    loadBook(book, parseInt(ch, 10) || 1);
  }
}

/* ---------- Event listeners ---------- */
function setupEventListeners() {
  $('#btn-search').addEventListener('click', openSearch);
  $('#btn-close-search').addEventListener('click', closeSearch);
  $('#search-input').addEventListener('input', (e) => {
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => performSearch(e.target.value), 220);
  });
  $('#search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });

  $('#btn-bookmark').addEventListener('click', toggleBookmark);
  $('#btn-bookmarks').addEventListener('click', openBookmarks);
  $('#btn-close-bookmarks').addEventListener('click', closeBookmarks);

  $('#btn-theme').addEventListener('click', toggleTheme);
  $('#btn-menu').addEventListener('click', toggleSidebar);

  $('.verses').addEventListener('click', (e) => {
    if (e.target.classList.contains('word')) {
      showWordLookup(e.target.textContent);
    }
  });

  $('#dict-close').addEventListener('click', () => {
    $('#dict-modal').classList.remove('open');
  });
  $('#dict-modal').addEventListener('click', (e) => {
    if (e.target === $('#dict-modal')) {
      $('#dict-modal').classList.remove('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeBookmarks();
      $('#dict-modal').classList.remove('open');
    }
  });

  window.addEventListener('hashchange', loadFromURL);
}

/* ---------- Start ---------- */
document.addEventListener('DOMContentLoaded', () => {
  init().then(() => {
    loadFromURL();
    updateBookmarkButton();
  });
});
