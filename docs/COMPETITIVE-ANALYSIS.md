# Competitive analysis — where CipherScope stands

*Researched 2026-09-08. Sources: vendor pages, GitHub API, public docs.*

## Landscape

The crypto-discovery / PQC-readiness market has three tiers:

| Tier | Players | What they sell |
|---|---|---|
| Enterprise platforms | **IBM Guardium Cryptography Manager / Quantum Safe**, SandboxAQ (AQtive Guard), Keyfactor, Venafi (CyberArk), Entrust, InfoSec Global | Full crypto-agility programs: discovery across hybrid cloud, HSMs, certs, policy enforcement, lifecycle management, remediation workflows. Six-figure contracts, sales-led. |
| Open-source CBOM tooling | **CBOMkit** (IBM-origin, 137★) + `sonar-cryptography` plugin (85★), `sbom-tools` (241★, generic SBOM/CBOM diff) | Cryptography Bill of Materials generation (CycloneDX CBOM), SonarQube integration, viewers, compliance checks. |
| Point scanners | **QuantumSeal** (113★), academic tools (CryptoGuard, CogniCrypt, CryptoLint) | Regex/AST crypto-indicator inventories, crypto API-misuse detection (mostly Java/Android). |

## Head-to-head

| Capability | **CipherScope** | QuantumSeal | CBOMkit | IBM Quantum Safe |
|---|:-:|:-:|:-:|:-:|
| Source scan (multi-language regex) | ✅ 10 file types + nginx/sshd/Dockerfile/openssl | ✅ | ✅ (via SonarQube) | ✅ |
| AST-level detection | ✅ Python (call-graph, import aliases) | ❌ text-only | partial (Java symbols if built) | ✅ |
| X.509 cert/key parsing (expiry, self-signed, sig hash) | ✅ | ❌ reads text only | ❌ | ✅ |
| Mosca theorem risk scoring (X+Y>Z, configurable) | ✅ | priority score (own taxonomy) | policy checks | ✅ (proprietary) |
| PQC replacement mapping (ML-KEM/ML-DSA per finding) | ✅ | ✅ | partial | ✅ |
| SARIF → GitHub code scanning | ✅ native | ❌ | ❌ | ❌ (own console) |
| Live risk dashboard (heatmap, gauge, filters) | ✅ React | static HTML/MD render | web viewer | ✅ enterprise console |
| CI gate (`--fail-on-critical`) | ✅ | baseline diff recipe | GitHub Action | — |
| CBOM (CycloneDX) export | ❌ roadmap | ✅ | ✅ (core format) | ✅ |
| Diff/baseline mode | ❌ roadmap | ✅ | ✅ | ✅ |
| Dependencies | stdlib + `cryptography` | zero (Rust std) | Docker + SonarQube stack | appliance/agent fleet |
| Cost | open source (MIT) | open source | open source | enterprise $$ |

## Honest gap analysis (where we lose today)

1. **No CBOM export** — CycloneDX CBOM is becoming the interchange standard (CISA, BSI push). CBOMkit and QuantumSeal already emit it. This is the #1 roadmap item.
2. **AST depth** — Python only. QuantumSeal covers more languages by regex; CBOMkit's SonarQube plugin does real Java symbol resolution.
3. **No diff/baseline mode** — can't show "migration closed 12 findings this quarter" yet.
4. **No aggregation** — single repo per scan; CBOMkit has a database + API for org-wide rollups.

## Where CipherScope wins

- **Fastest path from clone → insight**: `python3 scanner.py <dir>` + `npm run dev`. No SonarQube stack, no Docker fleet, no agents.
- **Only open-source tool combining** cert-expiry intelligence + Mosca arithmetic + SARIF/GitHub-native alerts + a live dashboard.
- **Defensible scoring** — the Mosca block on every finding makes the risk number auditable arithmetic, not a black-box score.
- **CI-first** — `--fail-on-critical` turns crypto debt into a build breaker, which is how this class of tool actually gets adopted.

## Positioning statement

> Enterprise platforms (IBM, SandboxAQ) sell a program; academic tools detect API
> misuse in Java. CipherScope is the missing middle: a zero-setup, open-source
> crypto-discovery scanner that any team can run in a terminal today, with
> quantum-risk scoring and PQC migration targets built into every finding.

## SIH (Smart India Hackathon) fit

- **Problem-statement fit**: SIH PSs rotate yearly and are sponsor-driven (MeitY, DRDO, CERT-In regularly sponsor cybersecurity PSs). No confirmed 2025 PS specifically names PQC discovery — verify against the current PS list on sih.gov.in before submitting. CipherScope maps cleanly onto any PS about *security auditing tools*, *crypto-agility*, *quantum readiness of critical infrastructure*, or *developer security tooling*.
- **India angle to pitch**: RBI-regulated banks and UIDAI-scale systems run decades of legacy crypto; MeitY's National Quantum Mission and DRDO's PQC program make "quantum-safe migration" a national priority. A Make-in-India, open-source CBOM-class tool is a policy-aligned story.
- **Judging strengths**: fully working end-to-end demo (scanner → JSON → live dashboard), real metrics (74 findings, 55% quantum-vulnerable), CI/CD + tests + SARIF integration show engineering maturity beyond a slide deck.
- **Before SIH, close these gaps** (in order): CBOM export → diff mode → Java AST. CBOM export alone moves CipherScope from "nice scanner" to "standards-aligned tool" in a judge's eyes.
