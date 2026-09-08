<div align="center">

```
   ╔══════════════════════════════════════════════════════════╗
   ║   ██████╗██╗██████╗ ██╗ ██╗   ██╗███████╗███████╗ ██████╗ ║
   ║  ██╔════╝██║██╔══██╗██║ ██║   ██║██╔════╝██╔════╝██╔════╝ ║
   ║  ██║     ██║██████╔╝██║ ██║   ██║███████╗█████╗  ██║      ║
   ║  ██║     ██║██╔═══╝ ██║ ╚██╗ ██╔╝╚════██║██╔══╝  ██║      ║
   ║  ╚██████╗██║██║     ██║  ╚████╔╝ ███████║███████╗╚██████╗ ║
   ║   ╚═════╝╚═╝╚═╝     ╚═╝   ╚═══╝  ╚══════╝╚══════╝ ╚═════╝ ║
   ╚══════════════════════════════════════════════════════════╝
        cryptographic discovery · quantum risk · PQC readiness
```

**Find every weak or quantum-vulnerable crypto primitive in your codebase — before someone else does.**

[![CI](https://github.com/prutxvi/cipherscope-ecdat/actions/workflows/ci.yml/badge.svg)](https://github.com/prutxvi/cipherscope-ecdat/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![python](https://img.shields.io/badge/python-3.10%2B-blue)](scanner/)
[![react](https://img.shields.io/badge/react-18-61dafb)](dashboard/)
[![code style](https://img.shields.io/badge/lint-ruff-261230)](ruff.toml)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

[Quickstart](#-quickstart) · [How it works](#-how-it-works) · [Rule coverage](#-rule-coverage) · [SARIF](#-github-code-scanning-sarif) · [Methodology](docs/METHODOLOGY.md) · [Competitive analysis](docs/COMPETITIVE-ANALYSIS.md) · [Contributing](CONTRIBUTING.md)

</div>

---

## 📖 Table of contents

- [Why](#-why)
- [Quickstart](#-quickstart)
- [How it works](#-how-it-works)
- [Rule coverage](#-rule-coverage)
- [Mosca theorem check](#-mosca-theorem-check)
- [GitHub code scanning (SARIF)](#-github-code-scanning-sarif)
- [The demo repo](#-the-demo-repo)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

## 🧭 Why

Most organisations have no inventory of their own cryptography. NIST finalised the
post-quantum standards (FIPS 203/204/205) in 2024, and **harvest-now-decrypt-later**
means data encrypted today with RSA/ECC is already at risk. CipherScope answers the
first question every CISO asks:

> *What crypto do we actually run, how much of it dies when a cryptographically
> relevant quantum computer (CRQC) arrives, and what do we replace it with?*

## 🚀 Quickstart

```bash
git clone https://github.com/prutxvi/cipherscope-ecdat.git
cd cipherscope-ecdat

# 1. scan the demo repo (writes dashboard/src/findings.json)
python3 scanner/scanner.py demo-repo -o dashboard/src/findings.json

# 2. launch the dashboard
cd dashboard && npm install && npm run dev   # → http://localhost:5173
```

Or with make: `make scan && make dev` · Or docker: `docker compose up --build` → :8080

### Scanner options

```bash
python3 scanner/scanner.py <dir> [-o findings.json]
      [--format json|sarif]     # SARIF 2.1.0 for GitHub code scanning
      [--data-lifetime 10]      # years data must stay secret (Mosca X)
      [--migration-years 6]     # years needed to migrate (Mosca Y)
      [--quantum-horizon 15]    # years until CRQC assumed (Mosca Z)
      [--exclude 'vendor/*']    # skip globs (repeatable)
      [--fail-on-critical]      # exit 1 on any Critical finding (CI gate)
```

## ⚙️ How it works

```
┌──────────────┐      ┌───────────────────────────────┐      ┌──────────────────┐
│  demo-repo/  │ ───▶ │         scanner.py            │ ───▶ │ dashboard (Vite) │
│ legacy code  │      │ ① regex rules (20+ patterns)  │      │  headline metric │
│ + certs      │      │ ② Python AST rules            │      │  risk heatmap    │
└──────────────┘      │ ③ X.509 / key parsing         │      │  findings table  │
                      │ ④ Mosca risk escalation       │      │  PQC gauge       │
                      │ ⑤ PQC replacement mapping     │      └──────────────────┘
                      └───────────────────────────────┘
                            ↓  findings.json / report.sarif
```

**Detection layers**

1. **Regex rules** — language-aware patterns for hashes, ciphers, modes, key sizes, TLS versions, SSH config, nginx, openssl CLI.
2. **Python AST** — real call-graph awareness: `hashlib.md5()`, `DES.new(key, DES.MODE_ECB)`, `rsa.generate_private_key(key_size=…)`, `ssl.SSLContext(ssl.PROTOCOL_TLSv1)` — with import alias resolution and docstring suppression.
3. **Certificate intelligence** — parses `.pem/.crt/.key`: algorithm, key size, expiry, self-signed, signature hash.
4. **Risk engine** — severity scoring + Mosca escalation + PQC mapping (see [methodology](docs/METHODOLOGY.md)).

## 📋 Rule coverage

| Algorithm | Category | Weak today | Quantum-vulnerable | Severity | PQC replacement |
|---|---|:-:|:-:|---|---|
| MD5 | hash | ✅ | ✅ | Critical | SHA-256 |
| SHA-1 | hash | ✅ | ✅ | High | SHA-256 |
| SHA-256/384/512 | hash | — | — | Low | keep (PQ-adequate) |
| DES | symmetric | ✅ | ✅ | Critical | AES-256-GCM |
| 3DES | symmetric | ✅ | ✅ | High | AES-256-GCM |
| RC4 | symmetric | ✅ | ✅ | Critical | AES-256-GCM / ChaCha20 |
| ECB mode | symmetric | ✅ | — | High | AEAD (GCM) |
| CBC mode | symmetric | ✅ | — | Medium | AEAD (GCM) |
| AES-128 / AES-256 | symmetric | — | — | Low | keep / prefer 256 |
| RSA-1024 | asymmetric | ✅ | ✅ | Critical | ML-KEM-768 (hybrid) |
| RSA-2048 | asymmetric | — | ✅ | Medium → High* | ML-KEM-768 (FIPS 203) |
| RSA-4096 | asymmetric | — | ✅ | Low | ML-KEM-768 |
| ECDSA / ECDH / Ed25519 | asymmetric | — | ✅ | Medium → High* | ML-DSA-65 (FIPS 204) |
| DSA / DH-1024 | asymmetric | ✅ | ✅ | High | ML-DSA / ML-KEM |
| TLS 1.0 / 1.1 | protocol | ✅ | — | Critical | TLS 1.3 |
| TLS 1.2 | protocol | — | — | Medium | TLS 1.3 |
| TLS 1.3 | protocol | — | — | Low | keep |
| X.509 expired / self-signed | certificate | ✅ | — | Critical / Medium | renew / CA-issued |

\* escalated by the Mosca check when `data_lifetime + migration > horizon`

## ⏳ Mosca theorem check

Michele Mosca's theorem turns "quantum risk" into arithmetic:

```
X = how long your data must stay secret
Y = how long a full crypto migration takes
Z = years until a CRQC exists

X + Y > Z  →  you are already too late for that data
```

CipherScope encodes this: when `X + Y > Z` (defaults 10 + 6 > 15), every
quantum-vulnerable finding is escalated one severity level and tagged with the
Mosca breakdown — so RSA-2048 stops being a "someday" problem and becomes a
**High** today.

## 🔎 GitHub code scanning (SARIF)

```bash
python3 scanner/scanner.py . --format sarif -o cipherscope.sarif
```

Upload with [github/codeql-action/upload-sarif](https://github.com/github/codeql-action) and every
finding appears natively in **Security → Code scanning alerts**, with rule descriptions,
severity mapping (Critical/High → `error`, Medium → `warning`, Low → `note`) and stable
fingerprints for deduplication. The included CI workflow does this automatically.

## 🧪 The demo repo

`demo-repo/` is a fictional **ACME Corp payments platform** — a deliberately messy
enterprise monorepo with planted weaknesses: MD5 password hashing, a DES-ECB card
vault, RSA-1024 partner keys, SHA-1 webhook signatures, TLS 1.0/1.1 gateways, weak
SSH ciphers, an expired self-signed certificate — plus a modern service using
AES-256-GCM and SHA-256 so the estate (and the metrics) look real.

## 📦 Deployment

| Target | Command |
|---|---|
| Vercel / Netlify | `cd dashboard && npm run build && npx vercel --prod` |
| Railway | `cd dashboard && railway up` (Dockerfile + nginx template included) |
| Docker | `docker compose up --build` → http://localhost:8080 |
| Any static host | ship `dashboard/dist/` |

## 🗺️ Roadmap

- [ ] CBOM export (CycloneDX 1.6 cryptography bill of materials)
- [ ] Java/Go AST parsers (deeper than regex)
- [ ] Dependency manifests (ciphers in package.lock, gradle, go.sum)
- [ ] Diff mode — only report *new* findings vs baseline
- [ ] Multi-repo scanning + trend dashboard

## 🤝 Contributing

PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Run `uvx pytest tests` and
`uvx ruff check scanner tests` before submitting. This project follows the
[Contributor Covenant](CODE_OF_CONDUCT.md).

## 📄 License

[MIT](LICENSE) © 2026 Pruthvi
