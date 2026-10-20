# Quick Highlight for Zotero

[![Release](https://img.shields.io/github/v/release/Zotero-Flow/zotero-quick-highlight)](https://github.com/Zotero-Flow/zotero-quick-highlight/releases/latest)
[![License: AGPL--3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

A compact PDF selection menu: highlight or underline in your last chosen color, with the existing translation result below it.

## Features

- Drag to select text and open Highlight / Underline automatically.
- Click either label to apply the remembered color immediately.
- Hover a row or click its arrow to open Zotero's eight colors. Both tools share the last selected color, including across sessions.
- Replace the native popup's duplicate color strip and tool toggle with compact 28px rows.
- Keep annotation actions above translation, with long translation results in a bounded scroll area.
- Prevent Translate for Zotero popup selections from appending previously selected text. Deliberate concatenation in its sidebar remains available.

## Install

1. Download `quick-highlight-0.1.5.xpi` from the [latest release](https://github.com/Zotero-Flow/zotero-quick-highlight/releases/latest).
2. In Zotero, open **Tools → Plugins → gear → Install Plugin From File…**.
3. Select the XPI. Open a PDF and drag across some text.

This plugin does not provide a translation engine. Install and configure [Translate for Zotero](https://github.com/windingwind/zotero-pdf-translate) separately to retain automatic translation.

## Compatibility

Tested on **macOS, Zotero 10.0.6, Translate for Zotero 2.4.8**. The manifest allows Zotero 10.0.6–10.0.*. Other operating systems and translation-plugin versions have not been verified. The translation integration uses the existing plugin's internal popup hook and may need adjustment when that plugin changes.

## Usage and accessibility

Choose a palette color to annotate and remember it. On the next selection, clicking Highlight or Underline uses that color directly. The arrow opens the palette without applying an annotation. Keyboard users can focus a row, press Right Arrow to enter the palette, use Left/Right to change focus, and Escape to close it.

## Privacy and removal

Quick Highlight adds no network requests. Translation continues through your existing translation provider and its settings; that provider may transmit selected text. The last color is stored in the Zotero preference `quickHighlight.color`. Annotations are created through Zotero's native controls. Disabling or removing the plugin restores the original selection UI and translation hook; saved annotations are retained.

## Development and releases

```sh
node --check bootstrap.js
node tests/translation.test.cjs
python3 scripts/release.py
```

`manifest.json` is the version source. Use `MAJOR.MINOR.PATCH`, document changes in [CHANGELOG.md](CHANGELOG.md), and follow [RELEASING.md](RELEASING.md). Each version tag publishes an XPI, `updates.json` and SHA-256 checksums. Installed copies check the latest release automatically. See [VALIDATION.md](VALIDATION.md) for observed results and limits.

## Credits and license

Uses Zotero's native Reader annotation controls and integrates with [Translate for Zotero](https://github.com/windingwind/zotero-pdf-translate). Release conventions follow [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template). This is an independent plugin, not an official Zotero product. [GNU AGPL v3](LICENSE).
