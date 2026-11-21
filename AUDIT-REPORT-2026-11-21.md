# KJV Text Integrity and Hidden-Content Audit

**Repository:** `ljrseals-dev/kjv`  
**Audited ref:** `main` at `aeed4c4beac0b7f5141d803314068c1333cbbe1c`  
**Audit date:** 2026-11-21  
**Method:** Static, source-first checks informed by `ljrseals-dev/boy-scouts-agent-audit` v2.0 doctrine and audit procedure.

## 1. Text identity and provenance

The bundled `data/kjv.json` is byte-for-byte the same Git blob as `midvash/bible-data/versions/en/kjv/kjv.json` at the audited upstream `main` revision.

- File size: 6,749,364 bytes
- Git blob SHA-1: `c0f2a72d5cc93e455fd54349c075d2cf0c0f6d48`
- SHA-256: `952c4b97e500261f183afa82d997909139797d6830fe464d1d7b45a7c130397d`
- Upstream metadata: `King James Version`, year 1769, 66 books, 1,189 chapters, 31,102 verses
- Upstream provenance caveat: `sourceUrl: null`, `sourceVerified: false`

The upstream project labels this as the standardized 1769 KJV, but its metadata says no source file was recorded at import and marks source verification false. Consequently, the exact bytes can be authenticated against the upstream repository, but this audit cannot honestly claim a complete independent collation against every page of the 1769 Oxford print volume. A scan-backed or independently verified 1769 reference transcription must be pinned before declaring every spelling and wording reading verified against the physical edition.

## 2. Verse-structure checks

Scanned all 31,102 verse records in the JSON payload.

| Check | Result |
|---|---:|
| Books | 66; expected order |
| Chapters | 1,189 |
| Verses | 31,102 |
| Duplicate book/chapter/verse keys | 0 |
| Chapter-number sequence errors | 0 |
| Verse-number sequence errors | 0 |
| Empty/non-string verse text | 0 |
| Leading/trailing whitespace | 0 |
| Repeated spaces | 0 |
| HTML/markup delimiters in verse text | 0 |
| Non-ASCII / zero-width / bidi control characters in verse text | 0 |

## 3. Punctuation findings

Three verse strings contain an anomalous space immediately before punctuation:

1. Numbers 15:39 — `do them ; and` (space before semicolon)
2. Ecclesiastes 7:16 — `destroy thyself ?` (space before question mark)
3. Isaiah 2:22 — `accounted of ?` (space before question mark)

These are formatting defects in the imported JSON. They were not silently edited in this audit branch because the upstream source metadata does not identify a verified source file for adjudicating exact 1769 punctuation. Correcting only whitespace is low risk, but the change should be made as a separate, explicit editorial normalization or after comparison with the pinned reference edition.

A mechanical parenthesis-balance scan also flagged paired editorial parentheses that span verse boundaries. Those are expected in this dataset's verse segmentation and were not treated as defects.

## 4. Hidden-message / covert-payload checks

Scanned the full verse-data payload and the repository's text-bearing application, style, manifest, service-worker, license, README, and extra-book metadata files for:

- zero-width, bidi, soft-hyphen, and other invisible Unicode characters;
- control characters outside normal line endings and tabs;
- long Base64-like and long hexadecimal payloads;
- suspicious encoded/decoder or dynamic-execution markers (including `atob`, `btoa`, `eval`, `Function`, `decodeURIComponent`, `fromCharCode`, and `crypto.subtle`);
- HTML tags or markup delimiters embedded in verse text;
- unexplained URLs in the verse-data payload.

No such indicators were found in the scanned text. The application source also contains no detected decoding or dynamic-code mechanism that would implement a concealed-message feature.

**Interpretation:** No evidence of an implemented hidden-message mechanism or obvious encoded payload was found. Hashes establish integrity/identity; they do not decrypt or prove the absence of every possible steganographic or semantic encoding scheme.

## 5. Boy Scouts audit-framework conformance and limitations

The referenced `boy-scouts-agent-audit` repository is a specification/documentation set (doctrine, invariants, audit procedure, schema, and acceptance matrix); no executable audit-agent implementation or runnable verification harness was present in its repository tree. This work applied its source-first, falsifiable-check, fail-closed, and auditor-honesty principles to the available repository evidence.

This was not a full v2.0 event-log run: no signed goal attestation, independent oracle attestation, dual-monitor attestation, Merkle transparency-log publication, or RFC 3161 timestamp token was generated. Those claims are intentionally not asserted.

## 6. Required next step for a complete edition-level proof

Pin an immutable source artifact for the exact 1769 Oxford standardized text (preferably a scan-backed transcription plus edition identifier, source URL, retrieval date, and SHA-256). Then compare all 31,102 verse records against that artifact, reporting every text difference separately from punctuation/orthographic variants. Do not modernize KJV spellings such as `shew`, `enquire`, `thou`, or `hath` merely because a contemporary spell-checker flags them.
