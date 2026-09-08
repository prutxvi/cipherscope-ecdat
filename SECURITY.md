# Security policy

## Supported versions

| Version | Supported |
|---|---|
| 1.0.x | ✅ |

## Reporting a vulnerability

CipherScope is a static analysis tool — it does not execute scanned code and
holds no secrets. That said, if you find a vulnerability in the scanner or the
dashboard (e.g. a finding that causes the dashboard to execute content, or a
scanner crash with security impact):

1. **Do not open a public issue.**
2. Email **pruthviraj73962@gmail.com** with reproduction steps.
3. You will get an acknowledgement within 72 hours and a fix timeline within 7 days.

## Scope notes

- `demo-repo/` intentionally contains weak cryptography. It is a test fixture —
  do not "fix" it in PRs; it exists to exercise the scanner.
- The dashboard renders scanner output as text only (no `innerHTML`), but
  treat third-party findings files as untrusted input.
