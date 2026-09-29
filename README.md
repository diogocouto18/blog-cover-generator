# blog-cover-generator

Generate consistent blog post cover images from a [Heroicons](https://heroicons.com) icon — no AI image generation service, no API costs, no rate limits. Renders an HTML page with [Playwright](https://playwright.dev) and screenshots it to a PNG.

![Example output](./example-post.png)

## Why

AI image generators are great until you run out of credits, need dozens of consistent images for a blog archive, or just want something you can regenerate for free, forever. This produces a clean, on-brand cover image (an icon on a solid background with a small accent badge) in under a second, fully offline after install.

## Usage

```bash
# One-time: download the Chromium build used for rendering (~150MB)
npx blog-cover-generator install-browser

npx blog-cover-generator <slug> <heroicon-name> [out-dir]
```

Example:

```bash
npx blog-cover-generator my-first-post server ./covers
# -> ./covers/my-first-post.png
```

Or install it globally / as a dev dependency: `npm install -g blog-cover-generator` (or `npm install -D blog-cover-generator`).

Run `blog-cover-generator --list-icons` to print every valid icon name (also browsable at [heroicons.com](https://heroicons.com)), `--help` for all options and `--version` for the version.

### Customizing colors and size

```bash
npx blog-cover-generator my-post rocket-launch \
  --width 1600 --height 900 \
  --bg "#111111" --fg "#FFFFFF" --accent "#FF5C00"
```

| Flag | Default | Description |
|---|---|---|
| `--width` | `2048` | Image width in pixels |
| `--height` | `1152` | Image height in pixels |
| `--bg` | `#0A0D16` | Background color |
| `--fg` | `#F2F3F5` | Icon color |
| `--accent` | `#1E9BFF` | Corner accent badge color |
| `--list-icons` | | Print available icon names and exit |
| `-h`, `--help` / `-v`, `--version` | | Help / version |

## How it works

1. Loads the requested Heroicons outline SVG and extracts its inner markup
2. Adds a small accent badge in the icon's own viewBox, so it stays anchored to the icon's corner regardless of icon shape
3. Renders it centered on a solid-color page at the requested dimensions
4. Launches headless Chromium via `playwright-core`, screenshots the page, saves the PNG

## Requirements

- Node.js 18+
- A Chromium binary (~150MB), downloaded explicitly once with `blog-cover-generator install-browser` (it is not fetched during `npm install`)

## Development

```bash
git clone https://github.com/diogocouto18/blog-cover-generator && cd blog-cover-generator
npm ci
npm run install-browser   # Chromium
npm run generate -- my-post server ./covers   # run from source via tsx
npm run typecheck && npm test
npm run build             # compile to dist/
scripts/smoke-pack.sh     # pack, install the tarball in a clean dir and render a PNG
```

## License

MIT
