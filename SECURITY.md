# Security Policy

## Supported versions

Only the latest release on the default branch (`master`) receives security fixes.

## Reporting a vulnerability

Please do not open a public issue for security problems. Report them privately
through GitHub's [private vulnerability reporting](https://github.com/diogocouto18/blog-cover-generator/security/advisories/new)
(Security tab, "Report a vulnerability").

Include what you found, how to reproduce it, and the affected version. You can
expect an acknowledgement within a few days; this is a small personal project,
so fixes are best effort.

## Scope

This tool runs locally: it renders an HTML page in headless Chromium from
command-line input (slug, icon name, colors, sizes). Input validation, path
handling for the output directory, and the supply chain of the published
package are in scope.
