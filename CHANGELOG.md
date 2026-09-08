# Changelog

All notable changes to CipherScope are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning is [SemVer](https://semver.org).

## [1.0.0] — 2026-09-08

### Added
- SARIF 2.1.0 output (`--format sarif`) for GitHub code scanning integration
- `--fail-on-critical` CI gate (exit 1 on any Critical finding)
- `--exclude` glob filtering (repeatable)
- `--version` flag
- Test suite: 22 cases covering detection, dedupe, Mosca escalation, cert parsing, SARIF, CLI behaviour
- CI: lint (ruff) + tests + dashboard build + SARIF artifact upload
- Release workflow (tag → GitHub release with artifacts)
- Docker Compose one-command demo
- Dashboard: export-findings button
- Full documentation: methodology, contributing guide, security policy, code of conduct

### Changed
- `Scanner` constructor parameters now have defaults (data_lifetime=10, migration_years=6, quantum_horizon=15)

## [0.1.0] — 2026-09-08

### Added
- Initial prototype
- Regex + AST detection engine (20+ rules across 10 file types)
- X.509 certificate / private-key analysis via `cryptography`
- Mosca theorem risk escalation
- PQC replacement mapping (ML-KEM / ML-DSA / SHA-256 / AES-256-GCM)
- React + Vite risk dashboard (heatmap, gauge, findings table, filters)
- `demo-repo/` vulnerable enterprise fixture
