import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CliError, pageHtml, parseArgs, suggestIcons, validateIconName, validateSlug } from '../generate-cover.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

test('parseArgs returns defaults and positional args', () => {
  const { opts, rest } = parseArgs(['my-post', 'home', 'out'])
  assert.deepEqual(rest, ['my-post', 'home', 'out'])
  assert.equal(opts.width, 2048)
  assert.equal(opts.height, 1152)
})

test('parseArgs applies valid flags', () => {
  const { opts, rest } = parseArgs(['a', 'home', '--width', '800', '--height', '600', '--bg', '#fff', '--fg', '#000000', '--accent', '#1E9BFF'])
  assert.deepEqual(rest, ['a', 'home'])
  assert.deepEqual([opts.width, opts.height, opts.bg, opts.fg, opts.accent], [800, 600, '#fff', '#000000', '#1E9BFF'])
})

for (const args of [
  ['--width', 'abc'],
  ['--width', '0'],
  ['--width', '-5'],
  ['--width', '1.5'],
  ['--height', ''],
  ['--width'],
  ['--bg', 'red'],
  ['--fg', '#12'],
  ['--accent', '#fff;}</style><script>'],
  ['--nope', '1'],
]) {
  test(`parseArgs rejects ${JSON.stringify(args)}`, () => {
    assert.throws(() => parseArgs(args), CliError)
  })
}

test('validateSlug accepts safe slugs and rejects path tricks', () => {
  assert.equal(validateSlug('my-post_2'), 'my-post_2')
  for (const bad of ['', '../x', 'a/b', 'a b', '.hidden', 'a.png', '-x']) {
    assert.throws(() => validateSlug(bad), CliError, bad)
  }
})

test('validateIconName checks format and existence, with suggestions', () => {
  assert.equal(validateIconName('home'), 'home')
  assert.throws(() => validateIconName('../home'), CliError)
  assert.throws(() => validateIconName('Home'), CliError)
  assert.throws(() => validateIconName('hom'), /Did you mean: home/)
  assert.throws(() => validateIconName('zzzzzzzzzzzz'), /Unknown icon/)
})

test('suggestIcons ranks close matches first', () => {
  assert.equal(suggestIcons('hom', ['cog', 'home', 'bolt'])[0], 'home')
  assert.deepEqual(suggestIcons('qqqqqqqq', ['cog', 'home']), [])
})

test('pageHtml embeds size, colors and icon markup', () => {
  const html = pageHtml('<path id="x"/>', { width: 1000, height: 500, bg: '#111111', fg: '#eeeeee', accent: '#0000ff' })
  assert.match(html, /width:1000px;height:500px;background:#111111/)
  assert.match(html, /color:#eeeeee/)
  assert.match(html, /<div class="icon-wrap"><path id="x"\/><\/div>/)
})

function run(...args: string[]) {
  return spawnSync(process.execPath, ['--import', 'tsx', join(ROOT, 'generate-cover.ts'), ...args], { cwd: ROOT, encoding: 'utf8' })
}

test('CLI exits 1 with a one-line error on bad input', () => {
  const r = run('post', 'home', tmpdir(), '--width', 'abc')
  assert.equal(r.status, 1)
  assert.equal(r.stderr.trim().split('\n').length, 1)
  assert.match(r.stderr, /--width must be a positive integer/)
})

test('smoke: CLI renders a PNG with the requested dimensions', () => {
  const out = mkdtempSync(join(tmpdir(), 'cover-'))
  try {
    const r = run('smoke', 'home', out, '--width', '640', '--height', '360')
    assert.equal(r.status, 0, r.stderr)
    const png = readFileSync(join(out, 'smoke.png'))
    assert.equal(png.subarray(1, 4).toString(), 'PNG')
    assert.equal(png.readUInt32BE(16), 640)
    assert.equal(png.readUInt32BE(20), 360)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('CLI --help, --version and --list-icons', () => {
  const help = run('--help')
  assert.equal(help.status, 0)
  assert.match(help.stdout, /Usage:/)
  assert.match(help.stdout, /install-browser/)

  const version = run('--version')
  assert.equal(version.status, 0)
  assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+/)

  const icons = run('--list-icons')
  assert.equal(icons.status, 0)
  const names = icons.stdout.trim().split('\n')
  assert.ok(names.includes('server'))
  assert.ok(names.length > 100)
})

test('parseArgs recognizes info flags and rejects unknown ones', () => {
  assert.equal(parseArgs(['-h']).flags.help, true)
  assert.equal(parseArgs(['--version']).flags.version, true)
  assert.equal(parseArgs(['--list-icons']).flags.listIcons, true)
  assert.throws(() => parseArgs(['-x']), CliError)
})
