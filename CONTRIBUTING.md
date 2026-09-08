# Contributing to CipherScope

Thanks for helping make crypto visibility better. This repo keeps the bar high
but the process light.

## Dev setup

```bash
git clone https://github.com/prutxvi/cipherscope-ecdat.git
cd cipherscope-ecdat

# scanner (python 3.10+, cryptography for cert parsing)
pip install -r scanner/requirements.txt

# dashboard
cd dashboard && npm install
```

## Before you open a PR

```bash
uvx pytest tests -q                 # or: python3 -m unittest discover -s tests
uvx ruff check scanner tests        # lint
cd dashboard && npm run build       # dashboard must build clean
```

CI runs all three — a green check is required to merge.

## Ground rules

- **Every new detection rule needs a test.** Add a case to `tests/test_scanner.py`
  covering the positive match *and* a near-miss negative (e.g. `!MD5` in nginx).
- **Severity changes need justification** in the PR description, referencing
  `docs/METHODOLOGY.md`.
- Keep the scanner stdlib-only except `cryptography` — it must run anywhere.
- Findings schema is a public contract: additive changes only.

## Reporting bugs

Open an issue with the [bug template](.github/ISSUE_TEMPLATE/bug_report.md) —
include the scanned snippet (redact secrets), expected vs actual finding.
