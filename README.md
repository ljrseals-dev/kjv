# KJV + Apocrypha Reader

Clean, text-only Bible reader inspired by John H. Boyer’s Aristotle Reader.

## Included

- Full **66-book King James Version** (public domain, 1769 text via midvash/bible-data)
- **Apocrypha & Pseudepigrapha** catalog with tradition-specific labels and detailed historical metadata (composition, date, language, manuscript witnesses, contents, canon status, and source references):
  - Tobit, Judith, Wisdom of Solomon, Ecclesiasticus (Sirach)
  - Baruch, Letter of Jeremiah
  - Prayer of Azariah, Susanna, Bel and the Dragon
  - 1 & 2 Maccabees
  - 1 & 2 Esdras
  - Prayer of Manasseh
  - Additions to Esther
  - 1 Enoch, 2 Enoch, 3 Enoch, Jubilees, Testaments of the Twelve Patriarchs, Assumption of Moses, 2 & 3 Baruch, Apocalypse of Abraham, Ascension of Isaiah, Psalms of Solomon, Sibylline Oracles, Life of Adam and Eve, Martyrdom of Isaiah, Ahikar, Damascus Document, Odes of Solomon, Letter of Aristeas, and the 1887 English Book of Jasher

Each extra work has a labeled historical dossier. Canonical status is described by tradition rather than treated as universal. The catalog is metadata only; verse text is intentionally deferred.

## Features

- Clean reading layout
- Full-text search (66-book KJV)
- Click any word for lookup panel
- Bookmarks
- Dark / light mode
- Offline-capable PWA (installable on Android)

## Current text status

| Section | Status |
|---------|--------|
| 66-book KJV | Fully readable |
| Apocrypha & Pseudepigrapha | Expanded labeled historical catalog; no extra verse text yet. Future additions must verify the exact edition, translation, and public-domain status (e.g. R. H. Charles, older KJV Apocrypha, 1887 Jasher). |

## How to run

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the local address in your browser. On Android Chrome → “Add to Home screen”.

## Credits

- Design inspiration: Aristotle Reader (John H. Boyer)
- KJV data: [midvash/bible-data](https://github.com/midvash/bible-data) (public domain)
- Historical metadata: `data/extra-books.json`; approximate dates and canon labels are qualified by scholarly uncertainty and reception tradition
- R. H. Charles, ed., *The Apocrypha and Pseudepigrapha of the Old Testament* (1913), used as a bibliographic guide; verse text is not bundled

## License

- Code: MIT
- KJV text: Public domain
