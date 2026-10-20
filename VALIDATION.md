# Validation

Native checks were performed on macOS with Zotero 10.0.6 and Translate for Zotero 2.4.8 on 2026-10-20.

- 0.1.2: twenty consecutive native text drags produced separate translation results; earlier paragraphs did not accumulate. Some drags selected partial words, recorded as selected rather than treated as full words.
- 0.1.3: native green highlight and blue underline records confirmed through Zotero's local API; a subsequent selection retained blue and clicking Underline applied it directly. Label-click yellow also confirmed. All six test annotations were undone and confirmed absent afterward.
- 0.1.3: long-to-short selection replaced the translated result; annotation menu remained above translation. Old color strip and toggle were hidden.
- 0.1.4: installed and visually confirmed compact 28px rows in the actual reader, with translation below.
- Source regression: reproduce concatenation using Translate for Zotero 2.4.8's task and popup functions; test 400 independent selections across all four concatenation-state combinations, sidebar concatenation, exception restoration and teardown.

0.1.5 changes distribution metadata only. Application restart, other operating systems, all translation engines and full multipage translation load were not verified. Translation quality is not assessed. Screenshots of the user's private library/PDFs are not published.
