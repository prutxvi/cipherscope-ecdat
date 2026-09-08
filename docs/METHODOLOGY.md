# Methodology — how CipherScope scores risk

This document explains the detection and scoring model so results can be
defended in front of a security team (or a hackathon jury).

## 1. Detection layers

| Layer | What it catches | False-positive controls |
|---|---|---|
| Regex rules | algorithm names, cipher strings, TLS versions, openssl CLI, SSH config | import/include lines skipped, comment-only lines skipped, nginx `!` negations respected, docstrings suppressed (Python) |
| Python AST | actual calls: `hashlib.md5()`, `DES.new(k, DES.MODE_ECB)`, `rsa.generate_private_key(key_size=…)`, `ssl.SSLContext(PROTOCOL_TLSv1)` | import-alias resolution, docstring line spans excluded from regex pass |
| X.509 parsing | certificate/key algorithm, key size, expiry, self-signed, signature hash | only real PEM material parsed |

Findings are deduplicated on `(file, line, algorithm, key_size)`.

## 2. Severity model

| Severity | Meaning | Examples |
|---|---|---|
| **Critical** | broken or trivially attackable today | MD5, DES, RC4, RSA-1024, TLS 1.0/1.1, expired certificates |
| **High** | practically weak or deprecated | SHA-1, 3DES, ECB mode, DSA, DH-1024, weak SSH cipher sets |
| **Medium** | sound today, quantum-exposed or outdated | RSA-2048, ECDSA, ECDH, TLS 1.2, CBC mode, self-signed certs |
| **Low** | acceptable / PQ-adequate, reported for inventory completeness | AES-256, SHA-256/384/512, TLS 1.3, RSA-4096 |

RSA severity is key-size dependent: `< 2048` → Critical, `2048–3071` → Medium,
`≥ 3072` → Low.

## 3. Mosca escalation

Michele Mosca's theorem: if

```
X (data lifetime) + Y (migration time) > Z (time until a CRQC)
```

then encrypted data will be decryptable by an adversary with a quantum computer
within its useful lifetime — "harvest now, decrypt later" is rational for the
attacker *today*.

Defaults: `X = 10y`, `Y = 6y`, `Z = 15y` → `16 > 15` → **HIGH quantum risk**.
When high, every `quantum_vulnerable` finding is escalated one severity level
(Medium → High) and carries a `mosca` block with the arithmetic, so the number
is auditable rather than vibes.

## 4. PQC replacement mapping

| Detected | Replacement | Standard |
|---|---|---|
| RSA (any size, key exchange/encryption) | ML-KEM-768, ideally hybrid X25519+ML-KEM | FIPS 203 |
| ECDSA / DSA / Ed25519 (signatures) | ML-DSA-65 | FIPS 204 |
| Long-lived signatures / firmware | SLH-DSA | FIPS 205 |
| MD5 / SHA-1 | SHA-256 | — |
| DES / 3DES / RC4 | AES-256-GCM or ChaCha20-Poly1305 | — |
| ECB / CBC | AEAD (GCM) | — |
| TLS ≤ 1.2 | TLS 1.3 | RFC 8446 |

## 5. Known limitations

- Regex layer is line-oriented; multi-line constructs (e.g. Java
  `KeyPairGenerator` + `initialize()` on separate lines) are only caught when
  co-located. AST parsers exist for Python only (roadmap).
- Key sizes are inferred from the same line as the algorithm mention.
- No data-flow analysis: a finding means "weak primitive present here", not
  "exploitable path exists".
- Quantum-vulnerability flags follow Shor (RSA/ECC/DSA) and Grover
  (MD5/SHA-1) reasoning; symmetric primitives with ≥256-bit keys are treated
  as PQ-adequate.
