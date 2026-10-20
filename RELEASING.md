# Releasing

1. Update `manifest.json` using `MAJOR.MINOR.PATCH`; keep the add-on ID unchanged.
2. Describe changes and compatibility limits in `CHANGELOG.md`.
3. Run the README checks and `python3 scripts/release.py`. Review the XPI, generated `updates.json` and `SHA256SUMS.txt` in `dist/`.
4. Install the candidate in Zotero and verify the changed behavior. Record any unverified platforms or flows honestly.
5. Commit the source and generated root `updates.json`, then push `main`.
6. Create and push `v<manifest version>`. The release workflow verifies the tag/version, runs checks and publishes the XPI, update manifest and checksums.
7. Download the public assets, verify their SHA-256 and check that update ID, version, compatibility and URL match the XPI.

Do not edit an existing release or reuse a version for different package bytes. Publish a new patch version for corrections. `updates.json` uses an immutable version-tagged XPI URL; installed copies query the latest release. Previous repository URLs redirect after the organization transfer.

Conventions: [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template), [Translate for Zotero](https://github.com/windingwind/zotero-pdf-translate).
