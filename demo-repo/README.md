# ACME Corp — Payments Platform Monorepo

![build](https://img.shields.io/badge/build-passing-brightgreen) ![coverage](https://img.shields.io/badge/coverage-61%25-yellow) ![status](https://img.shields.io/badge/audit-SOX%20remediation%20Q3%202026-red)

Monorepo for the ACME Corp payments platform. Contains the customer-facing
services, the edge gateway, legacy reporting tooling and infrastructure config.

## Services

| Service | Language | Port | Owner |
|---|---|---|---|
| `services/payments-api` | Python (Flask) | 8000 | payments-team@acme-corp.com |
| `services/user-service` | Java 8 (Spring Boot) | 8080 | identity-team@acme-corp.com |
| `services/edge-gateway` | Go | 9000 | platform-team@acme-corp.com |
| `services/notifications` | Go | 9100 | platform-team@acme-corp.com |
| `services/legacy-reporting` | C (OpenSSL) | — | data-team@acme-corp.com |
| `web-portal` | Node.js | 3000 | web-team@acme-corp.com |

## Quick start

```bash
docker-compose up -d
# payments API
cd services/payments-api && pip install -r requirements.txt && python app.py
# edge gateway
cd services/edge-gateway && go run main.go
```

## Certificates

TLS material lives in `infra/certs/`. Rotation runbook: `infra/scripts/gen_certs.sh`.
**NOTE:** the legacy partner integration (contract signed 2012) still requires
1024-bit RSA keys and TLS 1.1 — do not "fix" without legal sign-off.

## Warnings

- `services/payments-api/auth.py` is on the SOX remediation list (Q3 2026).
- Bastion SSH config is frozen until the vendor patch window in October.
- Do not bump `openjdk:8-jre-alpine` — the reporting engine breaks on Java 11.
