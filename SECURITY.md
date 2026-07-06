# Security Policy

## Supply-chain posture

`xls-reader` has **zero runtime dependencies** and is published to the public npm
registry with [npm provenance][provenance] attestations, so you can verify that
a release was built from this repository's CI. This is the whole point of the
project: it keeps `.xls` reading inside the same `npm audit` / Dependabot tooling
as the rest of your dependency tree.

## Supported versions

Only the latest published `0.x` release receives security fixes while the API
stabilizes toward `1.0`.

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |
| older   | ❌        |

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue.

- Preferred: use GitHub's [private vulnerability reporting][ghsa] on this
  repository (Security → Report a vulnerability).
- Or email **zanlucathiago@gmail.com** with details and, if possible, a
  minimal reproduction.

Because this library parses **untrusted binary input**, the reports we care most
about are parser-level: crashes, hangs/unbounded loops, or excessive memory use
triggered by a crafted `.xls`. When reporting, please attach the smallest
possible sample file (or a script that generates it) rather than a real,
proprietary workbook.

We aim to acknowledge reports within 72 hours and to ship a fix or mitigation as
quickly as the severity warrants. You'll be credited in the release notes unless
you prefer to stay anonymous.

[provenance]: https://docs.npmjs.com/generating-provenance-statements
[ghsa]: https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability
