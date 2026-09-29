// Generates a blog post cover image — a Heroicons outline icon on a solid
// background with a small accent badge in the corner — with no AI/paid
// generation service involved. Renders an HTML page with Playwright and
// screenshots it to a PNG.
//
// Usage: npx tsx generate-cover.ts <slug> <heroicon-name> [out-dir]
//   [--width N] [--height N] [--bg #hex] [--fg #hex] [--accent #hex]
//
// Icon names match files in node_modules/heroicons/24/outline/ (without .svg).
import { readFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
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

export class CliError extends Error {}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const ICON_NAME = /^[a-z0-9-]+$/
const SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]!
}

export function suggestIcons(name: string, available: string[], max = 3): string[] {
  return available
    .map((candidate) => ({
      candidate,
      score: candidate.includes(name) || name.includes(candidate) ? 0 : editDistance(name, candidate),
    }))
    .filter(({ score }) => score <= 3)
    .sort((x, y) => x.score - y.score || x.candidate.localeCompare(y.candidate))
    .slice(0, max)
    .map(({ candidate }) => candidate)
}

export function validateSlug(slug: string): string {
  if (!SLUG.test(slug)) {
    throw new CliError(`Invalid slug "${slug}": use only letters, digits, "-" and "_" (must start with a letter or digit)`)
  }
  return slug
}

export function validateIconName(name: string, iconsDir: string = ICONS_DIR): string {
  if (!ICON_NAME.test(name)) {
    throw new CliError(`Invalid icon name "${name}": must match ${ICON_NAME.source}`)
  }
  const available = readdirSync(iconsDir)
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.slice(0, -'.svg'.length))
  if (!available.includes(name)) {
    const close = suggestIcons(name, available)
    throw new CliError(`Unknown icon "${name}"${close.length ? `. Did you mean: ${close.join(', ')}?` : ''}`)
  }
  return name
}

export function loadIconInner(name: string, iconsDir: string = ICONS_DIR): string {
  validateIconName(name, iconsDir)
  const raw = readFileSync(join(iconsDir, `${name}.svg`), 'utf8')
  const match = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
  if (!match?.[1]) throw new Error(`Could not parse icon "${name}"`)
  return match[1]
}

export function pageHtml(iconInner: string, opts: typeof DEFAULTS): string {
  const { width, height, bg, fg } = opts
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:${width}px;height:${height}px;background:${bg};overflow:hidden;}
  .icon-wrap{position:absolute;left:${Math.round(width * 0.16)}px;top:${Math.round(height * 0.19)}px;width:${Math.round(width * 0.23)}px;height:${Math.round(width * 0.23)}px;color:${fg};}
  .icon-wrap svg{width:100%;height:100%;stroke-width:1.1;overflow:visible;}
</style></head>
<body><div class="icon-wrap">${iconInner}</div></body></html>`
}

function positiveInt(flag: string, value: string | undefined): number {
  if (value === undefined || !/^[0-9]+$/.test(value) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) {
    throw new CliError(`${flag} must be a positive integer (got "${value ?? ''}")`)
  }
  return Number(value)
}

function hexColor(flag: string, value: string | undefined): string {
  if (value === undefined || !HEX_COLOR.test(value)) {
    throw new CliError(`${flag} must be a hex color like #0A0D16 or #fff (got "${value ?? ''}")`)
  }
  return value
}

export function parseArgs(argv: string[]) {
  const opts = { ...DEFAULTS }
  const rest: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--width') opts.width = positiveInt(arg, argv[++i])
    else if (arg === '--height') opts.height = positiveInt(arg, argv[++i])
    else if (arg === '--bg') opts.bg = hexColor(arg, argv[++i])
    else if (arg === '--fg') opts.fg = hexColor(arg, argv[++i])
    else if (arg === '--accent') opts.accent = hexColor(arg, argv[++i])
    else if (arg.startsWith('--')) throw new CliError(`Unknown option "${arg}"`)
    else rest.push(arg)
  }
  return { opts, rest }
}

async function main(): Promise<void> {
  const { opts, rest } = parseArgs(process.argv.slice(2))
  const [slug, iconName, outDir = '.'] = rest
  if (!slug || !iconName) {
    throw new CliError('Usage: npx tsx generate-cover.ts <slug> <heroicon-name> [out-dir] [--width N] [--height N] [--bg #hex] [--fg #hex] [--accent #hex]')
  }
  validateSlug(slug)
  const iconInner = loadIconInner(iconName)
  // Accent badge lives inside the icon's own 24x24 viewBox (not the page),
  // so it stays anchored to the icon's corner regardless of icon shape.
  const badge = `<path d="M24,17 L24,24 L17,24 A7,7 0 0 0 24,17 Z" fill="${opts.accent}" stroke="none"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">${iconInner}${badge}</svg>`

  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `${slug}.png`)

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height } })
    await page.setContent(pageHtml(svg, opts))
    await page.screenshot({ path: outPath })
  } finally {
    await browser.close()
  }

  console.log(`[generate-cover] Wrote ${outPath}`)
}

// Only run when executed directly, so tests can import the helpers.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[generate-cover] ${error instanceof CliError ? error.message : `Failed: ${error instanceof Error ? error.message : error}`}`)
    process.exitCode = 1
  })
}
