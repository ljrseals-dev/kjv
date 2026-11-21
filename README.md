# KJV + Apocrypha Reader

Clean, text-only Bible reader inspired by John H. Boyer’s Aristotle Reader.

## Included

- Full **66-book King James Version** (public domain, 1769 text via midvash/bible-data)
- **Apocrypha & Pseudepigrapha** section with every book from the common expanded lists:
  - Tobit, Judith, Wisdom of Solomon, Ecclesiasticus (Sirach)
  - Baruch, Letter of Jeremiah
  - Prayer of Azariah, Susanna, Bel and the Dragon
  - 1 & 2 Maccabees
  - 1 & 2 Esdras
  - Prayer of Manasseh
  - Additions to Esther
  - **1 Enoch**, **Jubilees**, **Book of Jasher**

Each extra book has a clear **historical note** when selected.

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
| Apocrypha & Pseudepigrapha | Labeled + full history notes. Actual verse text can be added later from public-domain translations (R.H. Charles, older KJV Apocrypha, 1887 Jasher, etc.) |

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
- Extra books history compiled for this project

## License

- Code: MIT
- KJV text: Public domain
