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
const EXTRA_BOOKS = [
  {
    id: "Tobit",
    name: "Tobit",
    category: "Deuterocanonical",
    history: "3rd–2nd century BCE. Story of a righteous Israelite family in exile and the angel Raphael. Accepted as canonical by Catholic and Orthodox churches; placed in the Apocrypha by Protestants."
  },
  {
    id: "Judith",
    name: "Judith",
    category: "Deuterocanonical",
    history: "2nd century BCE. Heroic account of a Jewish widow who saves her people by defeating an enemy general. Deuterocanonical in Catholic and Orthodox Bibles."
  },
  {
    id: "Wis",
    name: "Wisdom of Solomon",
    category: "Deuterocanonical",
    history: "1st century BCE (Greek). Wisdom literature written in the name of Solomon. Emphasizes immortality of the soul and divine wisdom."
  },
  {
    id: "Sir",
    name: "Ecclesiasticus (Sirach)",
    category: "Deuterocanonical",
    history: "c. 180 BCE, written by Jesus ben Sirach. Extensive wisdom collection. One of the longest deuterocanonical books."
  },
  {
    id: "Bar",
    name: "Baruch",
    category: "Deuterocanonical",
    history: "Attributed to Baruch, scribe of Jeremiah. Contains confession, wisdom poems, and often the Letter of Jeremiah."
  },
  {
    id: "EpJer",
    name: "Letter of Jeremiah",
    category: "Deuterocanonical",
    history: "Often attached to Baruch. A strong warning against idolatry, presented as a letter from Jeremiah to the exiles."
  },
  {
    id: "PrAzar",
    name: "Prayer of Azariah",
    category: "Deuterocanonical",
    history: "Addition to the Book of Daniel (in the fiery furnace). Prayer and song of the three young men."
  },
  {
    id: "Sus",
    name: "Susanna",
    category: "Deuterocanonical",
    history: "Addition to Daniel. Story of a righteous woman falsely accused of adultery and vindicated by Daniel’s wisdom."
  },
  {
    id: "Bel",
    name: "Bel and the Dragon",
    category: "Deuterocanonical",
    history: "Two short additions to Daniel that mock idolatry: the story of Bel and the story of the dragon."
  },
  {
    id: "1Macc",
    name: "1 Maccabees",
    category: "Deuterocanonical",
    history: "Historical account of the Maccabean revolt against the Seleucids in the 2nd century BCE. Important for Jewish history."
  },
  {
    id: "2Macc",
    name: "2 Maccabees",
    category: "Deuterocanonical",
    history: "Parallel account of the Maccabean period with stronger theological emphasis (resurrection, intercession of the saints)."
  },
  {
    id: "1Esd",
    name: "1 Esdras",
    category: "Apocrypha",
    history: "Greek work overlapping Ezra–Nehemiah with additional material (including the famous debate of the three young men)."
  },
  {
    id: "2Esd",
    name: "2 Esdras (4 Ezra)",
    category: "Apocrypha",
    history: "Jewish apocalypse (late 1st century CE) with Christian additions. Highly influential in early Christianity."
  },
  {
    id: "PrMan",
    name: "Prayer of Manasseh",
    category: "Apocrypha",
    history: "Short penitential prayer attributed to King Manasseh of Judah. Found in some liturgical traditions."
  },
  {
    id: "AddEsth",
    name: "Additions to Esther",
    category: "Deuterocanonical",
    history: "Extra sections found in the Greek version of Esther (prayers, dreams, and expanded court scenes) not present in the Hebrew text."
  },
  {
    id: "Enoch",
    name: "1 Enoch",
    category: "Pseudepigrapha",
    history: "3rd–1st century BCE. Composite work including the Book of the Watchers, Parables, Astronomical Book, and Epistle of Enoch. Quoted in the New Testament (Jude). Survived complete only in Ethiopic. R.H. Charles 1917 translation is public domain."
  },
  {
    id: "Jub",
    name: "Jubilees",
    category: "Pseudepigrapha",
    history: "2nd century BCE. Retelling of Genesis and part of Exodus arranged by 49-year jubilee cycles. Strong emphasis on calendar and law. R.H. Charles translation is public domain."
  },
  {
    id: "Jasher",
    name: "Book of Jasher",
    category: "Pseudepigrapha / Legendary",
    history: "This is the 1887 English translation of a medieval Hebrew work (Sefer ha-Yashar). It is not the lost ancient ‘Book of Jasher’ mentioned in Joshua and 2 Samuel. Public domain. Contains expanded patriarchal narratives."
  }
];

/* ---------- Init ---------- */
async function init() {
  showLoading(true);
  try {
    const res = await fetch('data/kjv.json');
    if (!res.ok) throw new Error('Failed to load Bible data');
    bible = await res.json();
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

  // Extra books (Apocrypha + Pseudepigrapha)
  EXTRA_BOOKS.forEach(book => {
    const li = document.createElement('li');
    li.textContent = book.name;
    li.dataset.book = book.id;
    li.dataset.type = 'extra';
    li.classList.add('extra-book');
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
  hist.innerHTML = `
    <div class="history-label">${book.category}</div>
    <p>${book.history}</p>
    <p class="history-note"><strong>Text status:</strong> Public-domain English translations exist (R.H. Charles and older editions). 
    Full verse text can be added to this reader in the same JSON format as the KJV data. 
    Currently showing history and structure only.</p>
  `;

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
