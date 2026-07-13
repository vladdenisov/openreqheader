# OpenReqHeader browser extension

<h3 align="center">
  OpenReqHeader is a browser extension that allow you to modify HTTP request and response headers.
</h3>

## About this fork

This is a fork of ModHeader, taken from the codebase before v4 changed the license. It is maintained separately from the official ModHeader project and its store listings.

**Why this fork exists:** later official builds (Chrome ID `idgpnmonknjnojddfkpgkljpfnnfcklj`, same payload on the Edge listing) shipped a hidden spyware module disguised inside a fake `dayjs` bundle. It fingerprinted the browser, harvested the domain of every site visited, AES-GCM-encrypted the list, and uploaded it daily to a third-party endpoint (`api.stanfordstudies.com`) unrelated to ModHeader. The collector shipped behind a kill switch (an empty allowlist) so it could be silently flipped on in a future auto-update without any code review catching it beforehand. On top of that, the official build force-opened an ad/affiliate tab on every extension update — including on managed enterprise machines — and served in-app ads with a pay-to-remove upsell. Chrome Web Store pulled the listing on 2026-07-09 for malware; Edge pulled its copy shortly after.

This fork predates all of that. It does not contain the spyware SDK, the ad-tab code, or any telemetry/exfiltration path. Development here continues independently under the original AGPLv3 license.

**Is it OK to fork?** Yes. The code is licensed under the [GNU AGPLv3](LICENSE), a copyleft license that explicitly permits copying, modifying, and redistributing the software (including for commercial use), as long as source code stays available under the same license — including for network-accessible (SaaS) use. No permission from the original author is required.

## Manifest V3

This fork runs on Manifest V3 (Chrome dropped Manifest V2 support). Header/URL modification is implemented with `declarativeNetRequest` session rules (see `src/js/dnr-rules.js`) instead of blocking `webRequest`, which MV3 no longer allows. This carries real capability gaps versus the old engine:

- **No more per-request dynamic header values.** The old `function({url, oldValue}) {...}` header value (evaluated via `eval()` on every request) is unsupported — MV3's CSP forbids `eval` in the service worker, and DNR rules are static/precomputed anyway. Such a value is now dropped (treated as empty) with a console warning. Plain static values are unaffected.
- **A profile's global URL filters can't be combined with a redirect's own regex.** DNR only supports one `regexFilter` per rule, so a `urlReplacements` entry is scoped by its own pattern only, not intersected with the profile's separate `urlFilters`/`excludeUrlFilters`. Fold any extra scoping directly into the redirect's regex.
- **Raw append mode** (no separator) is approximated with DNR's native `append` operation, which always comma-separates — same as `comma` mode now.

## Features

- Add/modify/remove request headers and response headers
- Enable header modification based on URL/resource type
- Add comments to header
- Multiple different profiles
- Sorting headers by name, value, or comments
- Append value to existing request or response header
- Export and import header
- Clone profile
- Cloud backup
- Tab locking!

## Contribution

Pull requests welcome. Maintainers reserve the right to reject PRs that don't fit the project or add too much complexity for too little benefit.

This project is licensed under [AGPLv3](LICENSE) — fork, modify, redistribute, or use it commercially, as long as source stays available under the same license. Just don't impersonate the official ModHeader brand/listings.

## Development

Requires Node.js (Node 18+ recommended) and npm.

```sh
npm install       # install deps, also compiles SMUI theme CSS via postinstall
npm run start     # watch build for Chrome, output in dist/
npm run start-firefox  # watch build for Firefox, output in dist/
```

Load the extension unpacked while developing:

- Chrome: go to `chrome://extensions`, enable Developer mode, click "Load unpacked", select the `dist/` folder.
- Firefox: go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", select any file inside `dist/`.

`npm run start` watches source files and rebuilds automatically; reload the extension in the browser to pick up changes.

### Building

```sh
npm run build   # production build for Chrome, output in dist/
```

> Note: `build-firefox`/`build-opera`/`build-edge`/`build-all` scripts currently reference a deleted `utils/build.js` and are broken as of this writing.

### Testing

Unit tests use Jest and cover `src/js/`:

```sh
npm run test
```
