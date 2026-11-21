# Canonical punctuation correction note

**Scope:** the 66-book KJV reader's in-memory text normalization.

The 2026-11-21 static audit found three stray spaces immediately before punctuation in the imported KJV JSON. The application now corrects only these exact verse records after loading the JSON and before rendering or searching:

| Reference | Imported form | Reader form |
|---|---|---|
| Numbers 15:39 | `do them ; and` | `do them; and` |
| Ecclesiastes 7:16 | `destroy thyself ?` | `destroy thyself?` |
| Isaiah 2:22 | `accounted of ?` | `accounted of?` |

No words, spelling, punctuation marks, verse numbers, or other verses are changed. The correction function checks the complete expected source string for each reference and throws an error rather than applying a correction if any source string differs.

## Important source-data limitation

The original `data/kjv.json` blob remains byte-for-byte unchanged. Attempts to transmit a complete replacement of the 6.7 MB JSON file through the GitHub connector failed at the transport layer. Therefore these corrections apply to the application's in-memory data used by the reader and search, not to the raw downloadable JSON file. The three source strings remain visible in that raw file until a reliable large-file write path is available.

This is a punctuation-spacing normalization based on the exact strings identified by the audit, not a claim of full verse-by-verse collation against a pinned 1769 Oxford print source. Historical KJV spelling and wording remain untouched.

## Regression test

Run from the repository root:

```sh
node --test tests/canonical-punctuation.test.cjs
```

The test verifies all three corrections, confirms that exactly three verse strings change, and checks that a source-text mismatch fails closed.
