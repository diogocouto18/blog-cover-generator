// Generates a blog post cover image — a Heroicons outline icon on a solid
// background with a small accent badge in the corner — with no AI/paid
// generation service involved. Renders an HTML page with Playwright and
// screenshots it to a PNG.
//
// Usage: npx tsx generate-cover.ts <slug> <heroicon-name> [out-dir]
//   [--width N] [--height N] [--bg #hex] [--fg #hex] [--accent #hex]
//
// Icon names match files in node_modules/heroicons/24/outline/ (without .svg).
import { readFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const DEFAULTS = {
  width: 2048,
  height: 1152,
  bg: '#0A0D16',
  fg: '#F2F3F5',
  accent: '#1E9BFF',
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = join(__dirname, 'node_modules', 'heroicons', '24', 'outline')

function loadIconInner(name: string): string {
  const raw = readFileSync(join(ICONS_DIR, `${name}.svg`), 'utf8')
  const match = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
  if (!match?.[1]) throw new Error(`Could not parse icon "${name}"`)
  return match[1]
}

function pageHtml(iconInner: string, opts: typeof DEFAULTS): string {
  const { width, height, bg, fg } = opts
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:${width}px;height:${height}px;background:${bg};overflow:hidden;}
  .icon-wrap{position:absolute;left:${Math.round(width * 0.16)}px;top:${Math.round(height * 0.19)}px;width:${Math.round(width * 0.23)}px;height:${Math.round(width * 0.23)}px;color:${fg};}
  .icon-wrap svg{width:100%;height:100%;stroke-width:1.1;overflow:visible;}
</style></head>
<body><div class="icon-wrap">${iconInner}</div></body></html>`
}

function parseArgs(argv: string[]) {
  const opts = { ...DEFAULTS }
  const rest: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--width') opts.width = Number(argv[++i])
    else if (arg === '--height') opts.height = Number(argv[++i])
    else if (arg === '--bg') opts.bg = argv[++i]
    else if (arg === '--fg') opts.fg = argv[++i]
    else if (arg === '--accent') opts.accent = argv[++i]
    else rest.push(arg)
  }
  return { opts, rest }
}

async function main(): Promise<void> {
  const { opts, rest } = parseArgs(process.argv.slice(2))
  const [slug, iconName, outDir = '.'] = rest
  if (!slug || !iconName) {
    console.error('Usage: npx tsx generate-cover.ts <slug> <heroicon-name> [out-dir] [--width N] [--height N] [--bg #hex] [--fg #hex] [--accent #hex]')
    process.exitCode = 1
    return
  }

  const iconInner = loadIconInner(iconName)
  // Accent badge lives inside the icon's own 24x24 viewBox (not the page),
  // so it stays anchored to the icon's corner regardless of icon shape.
  const badge = `<path d="M24,17 L24,24 L17,24 A7,7 0 0 0 24,17 Z" fill="${opts.accent}" stroke="none"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">${iconInner}${badge}</svg>`

  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `${slug}.png`)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height } })
  await page.setContent(pageHtml(svg, opts))
  await page.screenshot({ path: outPath })
  await browser.close()

  console.log(`[generate-cover] Wrote ${outPath}`)
}

main().catch((error) => {
  console.error('[generate-cover] Failed:', error)
  process.exitCode = 1
})
