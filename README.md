# blog-cover-generator

Generate consistent blog post cover images from a [Heroicons](https://heroicons.com) icon — no AI image generation service, no API costs, no rate limits. Renders an HTML page with [Playwright](https://playwright.dev) and screenshots it to a PNG.

![Example output](./example-post.png)

## Why

AI image generators are great until you run out of credits, need dozens of consistent images for a blog archive, or just want something you can regenerate for free, forever. This produces a clean, on-brand cover image (an icon on a solid background with a small accent badge) in under a second, fully offline after install.

## Usage

```bash
npm install
npx tsx generate-cover.ts <slug> <heroicon-name> [out-dir]
```

Example:

```bash
npx tsx generate-cover.ts my-first-post server ./covers
# -> ./covers/my-first-post.png
```

Icon names match files in `node_modules/heroicons/24/outline/` (without the `.svg` extension) — browse the full set at [heroicons.com](https://heroicons.com).

### Customizing colors and size

```bash
npx tsx generate-cover.ts my-post rocket-launch \
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

## How it works

1. Loads the requested Heroicons outline SVG and extracts its inner markup
2. Adds a small accent badge in the icon's own viewBox, so it stays anchored to the icon's corner regardless of icon shape
3. Renders it centered on a solid-color page at the requested dimensions
4. Launches headless Chromium via `playwright-core`, screenshots the page, saves the PNG

## Requirements

- Node.js 18+
- `npm install` will download a Chromium binary via `playwright-core` (~150MB) on first install

## License

MIT
