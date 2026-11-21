const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const context = vm.createContext({ document: { addEventListener() {} }, localStorage: { getItem() { return null; }, setItem() {} } });
vm.runInContext(source, context, { filename: 'js/app.js' });

function loadBible() {
  return JSON.parse(fs.readFileSync(path.join(root, 'data/kjv.json'), 'utf8'));
}

function getVerse(data, bookCode, chapterNo, verseNo) {
  const book = data.books.find(item => item.book === bookCode);
  const chapter = book?.chapters.find(item => item.chapter === chapterNo);
  return chapter?.verses.find(item => item.number === verseNo);
}

test('normalizes only the three audited punctuation-spacing defects', () => {
  const data = loadBible();
  const before = JSON.stringify(data);

  context.__testBible = data;
  vm.runInContext('applyCanonicalPunctuationCorrections(__testBible)', context);

  assert.equal(getVerse(data, 'Num', 15, 39).text.includes('do them ; and'), false);
  assert.equal(getVerse(data, 'Num', 15, 39).text.includes('do them; and'), true);
  assert.equal(getVerse(data, 'Eccl', 7, 16).text.endsWith('destroy thyself?'), true);
  assert.equal(getVerse(data, 'Isa', 2, 22).text.endsWith('accounted of?'), true);

  const after = JSON.stringify(data);
  assert.notEqual(after, before);
  let changed = 0;
  const original = loadBible();
  for (const book of data.books) {
    for (let ci = 0; ci < book.chapters.length; ci++) {
      for (let vi = 0; vi < book.chapters[ci].verses.length; vi++) {
        if (book.chapters[ci].verses[vi].text !== original.books.find(b => b.book === book.book).chapters[ci].verses[vi].text) changed++;
      }
    }
  }
  assert.equal(changed, 3, 'no verse other than the three audited references may change');
});

test('fails closed if an audited source verse no longer matches exactly', () => {
  const data = loadBible();
  getVerse(data, 'Num', 15, 39).text = 'unexpected text';
  context.__testBible = data;
  assert.throws(
    () => vm.runInContext('applyCanonicalPunctuationCorrections(__testBible)', context),
    /Canonical text mismatch/
  );
});
