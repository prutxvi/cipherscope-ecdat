# CipherScope

**Cryptographic discovery & post-quantum readiness scanner** — find every weak or quantum-vulnerable crypto primitive in a codebase, and show it on a live risk dashboard.

![CI](https://github.com/prutxvi/cipherscope-ecdat/actions/workflows/ci.yml/badge.svg)
![python](https://img.shields.io/badge/python-3.10%2B-blue)
![react](https://img.shields.io/badge/react-18-61dafb)
![license](https://img.shields.io/badge/license-MIT-green)

---

## Why

Most organisations have no inventory of their own cryptography. NIST finalised the
post-quantum standards (FIPS 203/204/205) in 2024, and "harvest now, decrypt later"
means data encrypted today with RSA/ECC is already at risk. CipherScope answers the
first question every CISO asks:

> *What crypto do we actually run, how much of it dies when a cryptographically
> relevant quantum computer arrives, and what do we replace it with?*

## What it does

| Component | What it is |
|---|---|
| `scanner/` | Python CLI. Regex + AST rules across `.py .java .js .go .c .cpp .conf .yaml .sh` + Dockerfile/sshd_config. Parses `.pem/.crt/.key` with the `cryptography` library (algorithm, key size, expiry, self-signed). |
| `demo-repo/` | Deliberately vulnerable legacy enterprise codebase (planted MD5, SHA-1, DES-ECB, 3DES, RC4, RSA-1024, TLS 1.0/1.1, weak SSH ciphers, expired self-signed certs) so the scanner shows real findings. |
| `dashboard/` | React + Vite risk dashboard: quantum-vulnerability headline metric, algorithm risk heatmap, severity-badged findings table, category/severity filters, PQC readiness gauge. |

### Intelligence built into the scanner

- **Mosca theorem check** — if `data_lifetime + migration_years > quantum_horizon` (default 15y),
  quantum-vulnerable findings are escalated: harvest-now-decrypt-later is realistic.
- **PQC migration mapping** — every finding carries a concrete replacement:
  RSA → **ML-KEM-768** (FIPS 203) · ECDSA/DSA → **ML-DSA** (FIPS 204) ·
  SHA-1/MD5 → **SHA-256** · DES/3DES/RC4 → **AES-256-GCM** · TLS ≤1.1 → **TLS 1.3**.
- **Severity model** — Critical (broken today: MD5, DES, RC4, RSA-1024, expired certs, TLS ≤1.1),
  High (SHA-1, 3DES, ECB, weak DH/SSH), Medium (quantum-exposed ECC/RSA-2048, TLS 1.2),
  Low (PQ-safe: AES-256, SHA-256/384/512, TLS 1.3). Mosca-escalated findings bump one level.

## Quickstart

```bash
# 1. scan the demo repo (writes dashboard/src/findings.json)
python3 scanner/scanner.py demo-repo -o dashboard/src/findings.json

# 2. launch the dashboard
cd dashboard && npm install && npm run dev   # → http://localhost:5173
```

Or with make:

```bash
make scan && make dev
```

### Scanner options

```bash
python3 scanner/scanner.py <dir> [-o findings.json]
      [--data-lifetime 10]      # years data must stay secret (Mosca X)
      [--migration-years 6]     # years needed to migrate (Mosca Y)
      [--quantum-horizon 15]    # years until CRQC assumed (Mosca Z)
```

## Finding schema

```json
{
  "file": "services/payments-api/auth.py",
  "line": 36,
  "algorithm": "DES",
  "key_size": null,
  "category": "symmetric",
  "weak_today": true,
  "quantum_vulnerable": true,
  "severity": "Critical",
  "recommendation": "Replace DES (56-bit) with AES-256-GCM",
  "code": "cipher = DES.new(key, DES.MODE_ECB)",
  "mosca": { "total_years": 16, "high_risk": true }
}
```

## Architecture

```
┌──────────────┐    findings.json     ┌──────────────────┐
│ demo-repo/   │ ──▶  scanner.py  ──▶ │ dashboard (Vite) │ ──▶ browser
│ (legacy code)│     regex + AST      │  React + SVG     │
└──────────────┘     + X.509 parse     └──────────────────┘
```

## Deployment

The dashboard is a static build — deploy anywhere:

```bash
cd dashboard && npm run build          # → dist/
npx vercel --prod                      # or netlify, s3, github pages
```

Railway (nginx container included):

```bash
cd dashboard && railway init && railway up && railway domain
```

## Repo layout

```
scanner/       scanner.py, requirements.txt
demo-repo/     vulnerable enterprise monorepo (scan target)
dashboard/     React/Vite app + Dockerfile + nginx template
.github/       CI: scan demo-repo → validate JSON → build dashboard
```

## Disclaimer

Hackathon prototype. Rule-based detection with a curated knowledge base — not a
substitute for a full cryptographic inventory (CBOM) audit. Findings are advisory.

## License

[MIT](LICENSE)
