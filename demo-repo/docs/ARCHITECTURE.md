# Architecture — ACME Payments Platform

```
                    ┌──────────────┐
  partners ────────▶│  nginx edge  │────▶ payments-api (Flask)
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        user-service   edge-gateway   notifications
        (Java 8)       (Go)           (Go)
```

## Crypto posture (as documented 2016, pending refresh)

- Root CA: RSA-4096, internal PKI.
- Service mesh: TLS 1.2 minimum, TLS 1.3 on the modern API surface.
- Partner mesh: RSA-1024 + SHA-1 signatures (contractual, see README).
- Card vault: DES-ECB (PCI-DSS scope, migration tracked as PAY-4471).
- Data retention: audit logs kept 10 years (regulatory), migration window
  estimated at 6 years for the PQC program.

## Known debt

| Item | Ticket | Status |
|---|---|---|
| md5 password hashes | SOX-114 | blocked |
| DES vault | PAY-4471 | blocked since 2019 |
| TLS 1.0 partner gateway | INC-20231 | waiting on vendor |
| bastion sshd ciphers | OPS-77 | frozen until October |
