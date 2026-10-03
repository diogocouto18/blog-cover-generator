# Contributing

Thanks for taking a look. This is a small personal project, so the process
is light.

## Setup

Requirements: Node.js 18+ and npm.

```bash
git clone https://github.com/diogocouto18/blog-cover-generator.git
cd blog-cover-generator
npm ci
npm run install-browser   # downloads Chromium (~150MB)
npm run typecheck && npm test
```

Run from source with `npm run generate -- my-post server ./covers`.

## Making a change

1. Open an issue first for anything bigger than a small fix.
2. Branch from `master`; one topic per pull request.
3. Add or update tests in `test/` (they use the built-in `node:test` runner).
4. Run `npm run typecheck`, `npm test` and `npm run build` before pushing.
   `scripts/smoke-pack.sh` checks the packed tarball end to end. CI runs the
   same checks.

## Commit messages

`[Type] Brief Description In Title Case`, for example
`[Fix] Reject Slugs With Path Separators`. Common types: `Doc`, `Fix`,
`Test`, `CI`, `Chore`, `Infra`.

## Code style

- TypeScript, ES modules; keep runtime dependencies minimal.
- Validate all CLI input; never build file paths from unchecked values.
- Write code, comments and docs in English.

## License

By contributing you agree that your contribution is released under the
[MIT License](LICENSE).
