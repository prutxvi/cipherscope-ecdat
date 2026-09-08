#!/usr/bin/env python3
"""
CipherScope — cryptographic discovery & PQC-readiness scanner.

Detects weak / quantum-vulnerable cryptography across a codebase:
  * regex rules over .py .java .js .go .c .cpp .conf .yaml .yml .sh + Dockerfile/sshd_config
  * Python AST rules (hashlib.*, Crypto.Cipher.*, cryptography rsa/ec, ssl contexts)
  * X.509 certificate / private-key parsing (.pem .crt .key) via the `cryptography` library
  * Mosca theorem risk check: data_lifetime + migration_years > quantum_horizon (15y)
  * PQC migration mapping (RSA->ML-KEM, ECDSA->ML-DSA, SHA-1->SHA-256, DES->AES-256-GCM ...)

Usage:
    python3 scanner.py <directory> [-o findings.json] [--format json|sarif]
                       [--data-lifetime 10] [--migration-years 6] [--quantum-horizon 15]
                       [--exclude GLOB]... [--fail-on-critical]

Output: a single JSON array of findings (default) or a SARIF 2.1.0 report
(uploadable to GitHub code scanning) written to the output path.
"""

from __future__ import annotations

import argparse
import ast
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from fnmatch import fnmatch
from pathlib import Path

__version__ = "1.0.0"
TOOL_URI = "https://github.com/prutxvi/cipherscope-ecdat"

# --------------------------------------------------------------------------- config

SCAN_EXTENSIONS = {".py", ".java", ".js", ".go", ".c", ".cpp", ".conf", ".yaml", ".yml", ".sh", ".h"}
SPECIAL_FILENAMES = {"Dockerfile", "sshd_config", "ssh_config", "my.cnf", "httpd.conf"}
CERT_EXTENSIONS = {".pem", ".crt", ".key", ".cer"}
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".idea", ".vscode", ".next", "target"}

SEVERITY_RANK = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}

# ------------------------------------------------------- algorithm knowledge base + PQC map

ALGOS: dict[str, dict] = {
    # algorithm: category, weak_today, quantum_vulnerable, base severity, PQC recommendation
    "MD5":        dict(category="hash",        weak=True,  quantum=True,  severity="Critical", rec="Replace MD5 with SHA-256 (collisions are trivial to forge)"),
    "SHA-1":      dict(category="hash",        weak=True,  quantum=True,  severity="High",     rec="Migrate to SHA-256 (practical collisions since SHAttered, 2017)"),
    "SHA-256":    dict(category="hash",        weak=False, quantum=False, severity="Low",      rec="Post-quantum adequate — keep"),
    "SHA-384":    dict(category="hash",        weak=False, quantum=False, severity="Low",      rec="Post-quantum adequate — keep"),
    "SHA-512":    dict(category="hash",        weak=False, quantum=False, severity="Low",      rec="Post-quantum adequate — keep"),
    "DES":        dict(category="symmetric",   weak=True,  quantum=True,  severity="Critical", rec="Replace DES (56-bit) with AES-256-GCM"),
    "3DES":       dict(category="symmetric",   weak=True,  quantum=True,  severity="High",     rec="Replace 3DES with AES-256-GCM (Sweet32 attack, 112-bit)"),
    "RC4":        dict(category="symmetric",   weak=True,  quantum=True,  severity="Critical", rec="Prohibit RC4 entirely; use AES-256-GCM or ChaCha20-Poly1305"),
    "AES":        dict(category="symmetric",   weak=False, quantum=False, severity="Low",      rec="Prefer AES-256 in GCM mode"),
    "AES-128":    dict(category="symmetric",   weak=False, quantum=False, severity="Low",      rec="Acceptable; AES-256 gives a Grover margin"),
    "AES-256":    dict(category="symmetric",   weak=False, quantum=False, severity="Low",      rec="Post-quantum safe — keep"),
    "ECB mode":   dict(category="symmetric",   weak=True,  quantum=False, severity="High",     rec="ECB leaks plaintext patterns; switch to AEAD (AES-256-GCM)"),
    "CBC mode":   dict(category="symmetric",   weak=True,  quantum=False, severity="Medium",   rec="Padding-oracle risk; prefer GCM"),
    "RSA":        dict(category="asymmetric",  weak=False, quantum=True,  severity="Medium",   rec="Plan migration to ML-KEM-768 (hybrid X25519+ML-KEM, FIPS 203)"),
    "ECDSA":      dict(category="asymmetric",  weak=False, quantum=True,  severity="Medium",   rec="Plan migration to ML-DSA-65 (FIPS 204)"),
    "ECDH":       dict(category="asymmetric",  weak=False, quantum=True,  severity="Medium",   rec="Plan migration to ML-KEM-768 hybrid key agreement"),
    "Ed25519":    dict(category="asymmetric",  weak=False, quantum=True,  severity="Medium",   rec="Plan migration to ML-DSA / SLH-DSA"),
    "DSA":        dict(category="asymmetric",  weak=True,  quantum=True,  severity="High",     rec="Deprecated; move to ML-DSA or EdDSA"),
    "DH-1024":    dict(category="asymmetric",  weak=True,  quantum=True,  severity="High",     rec="Weak 1024-bit DH group; move to X25519+ML-KEM hybrid"),
    "TLS 1.0":    dict(category="protocol",    weak=True,  quantum=False, severity="Critical", rec="Prohibit TLS 1.0; require TLS 1.3"),
    "TLS 1.1":    dict(category="protocol",    weak=True,  quantum=False, severity="Critical", rec="Prohibit TLS 1.1; require TLS 1.3"),
    "TLS 1.2":    dict(category="protocol",    weak=False, quantum=False, severity="Medium",   rec="Acceptable today; plan TLS 1.3 rollout"),
    "TLS 1.3":    dict(category="protocol",    weak=False, quantum=False, severity="Low",      rec="Current best practice — keep"),
    "X.509 expired":    dict(category="certificate", weak=True, quantum=False, severity="Critical", rec="Renew immediately — certificate has expired"),
    "X.509 self-signed": dict(category="certificate", weak=True, quantum=False, severity="Medium",  rec="Replace with CA-issued certificate"),
}


def rsa_severity(key_size: int | None) -> str:
    if key_size is None:
        return "Medium"
    if key_size < 2048:
        return "Critical"
    if key_size < 3072:
        return "Medium"
    return "Low"


def rsa_weak(key_size: int | None) -> bool:
    return key_size is not None and key_size < 2048


def rsa_rec(key_size: int | None) -> str:
    if key_size is None:
        return ALGOS["RSA"]["rec"]
    if key_size < 2048:
        return f"Retire this {key_size}-bit key immediately; adopt ML-KEM-768 (hybrid X25519+ML-KEM)"
    if key_size < 3072:
        return "Plan migration to ML-KEM-768 (hybrid X25519+ML-KEM, FIPS 203)"
    return "Quantum-vulnerable but strong today; schedule ML-KEM-768 migration"


# ------------------------------------------------------------------------------ rules

@dataclass(frozen=True)
class Rule:
    id: str
    pattern: str
    algorithm: str
    key_group: int = 0          # regex group index holding a key size (0 = none)
    exts: tuple = ()            # restrict to these extensions (empty = all)
    ignore_case: bool = True


RULES: list[Rule] = [
    # ---- hashes ----
    Rule("md5",    r"\bMD5\b|hashlib\.md5|createHash\(\s*['\"]md5['\"]|MD5_(?:Init|Update|Final)|hmac[-_]md5|md5\.New\b|MD5with", "MD5"),
    Rule("sha1",   r"\bSHA[-_]?1(?![0-9])|hashlib\.sha1|createHash\(\s*['\"]sha1['\"]|sha1\.New\b|SHA1with|hmac[-_]sha1", "SHA-1"),
    Rule("sha256", r"\bSHA[-_]?256\b|hashlib\.sha256|createHash\(\s*['\"]sha256['\"]|sha256\.Sum256|SHA256with", "SHA-256"),
    Rule("sha384", r"\bSHA[-_]?384\b|SHA384with", "SHA-384"),
    Rule("sha512", r"\bSHA[-_]?512\b|hashlib\.sha512|SHA512with", "SHA-512"),
    # ---- symmetric ----
    Rule("3des",   r"\b3DES\b|\bDESede\b|\bDES[-_]EDE3\b|TripleDES|des[-_]ede3|3des[-_]cbc", "3DES"),
    Rule("des",    r"\bDES\b|DES\.new\b|des\.NewCipher|DES_(?:ecb_encrypt|set_key|ede3)", "DES"),
    Rule("rc4",    r"\bRC4\b|arcfour|RC4[-_]SHA", "RC4"),
    Rule("aes",    r"\bAES[-_ ]?(128|256)?\b|AES\.new\b|aes\.NewCipher", "AES", key_group=1),
    Rule("ecb",    r"MODE_ECB|/ECB/|\bECB\b", "ECB mode"),
    Rule("cbc",    r"MODE_CBC|/CBC/|aes\d+-cbc|[-_]cbc\b", "CBC mode"),
    # ---- asymmetric ----
    Rule("rsa",    r"\bRSA\b|crypto/rsa|rsa\.GenerateKey|RSA\.generate|RSA\.import|genrsa|PKCS1", "RSA"),
    Rule("ecdsa",  r"\bECDSA\b|ecdsa\.|Prime256v1|secp256r1|\bP[-_]256\b|SHA\d+withECDSA", "ECDSA"),
    Rule("ecdh",   r"\bECDH\b|ecdh\.|X25519|x25519|Curve25519", "ECDH"),
    Rule("ed25519", r"\bEd25519\b|ed25519\.", "Ed25519"),
    Rule("dsa",    r"\bDSA\b|crypto/dsa|SHA1withDSA|DSACrypto|dsa\.GenerateKey", "DSA"),
    Rule("dh1",    r"diffie-hellman-group1|dh_group1|DHGroup1", "DH-1024"),
    # ---- protocols ----
    Rule("tls10",  r"TLSv1(?![\d.])|TLS 1\.0\b|PROTOCOL_TLSv1\b|VersionTLS10|TLSv1\.0\b", "TLS 1.0"),
    Rule("tls11",  r"TLSv1\.1|TLS 1\.1\b|PROTOCOL_TLSv1_1|VersionTLS11", "TLS 1.1"),
    Rule("tls12",  r"TLSv1\.2|TLS 1\.2\b|PROTOCOL_TLSv1_2|VersionTLS12", "TLS 1.2"),
    Rule("tls13",  r"TLSv1\.3|TLS 1\.3\b|VersionTLS13", "TLS 1.3"),
]

# key-size extraction patterns applied to the whole line when RSA is detected
RSA_SIZE_PATTERNS = [
    r"RSA\.generate\((\d{3,4})",
    r"rsa\.GenerateKey\([^,)]*,\s*(\d{3,4})",
    r"key_size\s*=\s*(\d{3,4})",
    r"\.initialize\((\d{3,4})\)",
    r"genrsa[^\n]*?(\d{3,4})\s*$",
    r"(\d{3,4})\s*-?\s*bit",
    r"\b(1024|2048|3072|4096)\b",
]

# lines we never flag (imports / includes / pure comments) to keep findings precise
SKIP_LINE_PATTERNS = [
    r"^\s*import\s", r"^\s*from\s+\S+\s+import\b", r"^\s*import\s*\(",
    r'^\s*"[^"]+"\s*$',                 # go import block entries
    r"^\s*#\s*include\b",
    r"^\s*(#|//|/\*|\*|--|;)",          # comment-only lines
]

# --------------------------------------------------------------------------- scanner core

class Scanner:
    def __init__(self, root: Path, data_lifetime: float = 10, migration_years: float = 6,
                 quantum_horizon: float = 15, exclude: list[str] | None = None):
        self.root = root
        self.data_lifetime = data_lifetime
        self.migration_years = migration_years
        self.quantum_horizon = quantum_horizon
        self.exclude = exclude or []
        self.findings: list[dict] = []
        self._seen: set[tuple] = set()
        self.files_scanned = 0
        self.mosca_high = (data_lifetime + migration_years) > quantum_horizon

    # ------------------------------------------------------------------ emit
    def emit(self, file: str, line: int, algorithm: str, key_size=None, code: str = "") -> None:
        key = (file, line, algorithm, key_size)
        if key in self._seen:
            return
        self._seen.add(key)

        meta = ALGOS[algorithm]
        severity = meta["severity"]
        weak = meta["weak"]
        quantum = meta["quantum"]

        if algorithm == "RSA":
            severity = rsa_severity(key_size)
            weak = rsa_weak(key_size)

        finding = {
            "file": file,
            "line": line,
            "algorithm": algorithm,
            "key_size": key_size,
            "category": meta["category"],
            "weak_today": weak,
            "quantum_vulnerable": quantum,
            "severity": severity,
            "recommendation": rsa_rec(key_size) if algorithm == "RSA" else meta["rec"],
            "code": code.strip()[:160],
        }

        # Mosca theorem: if (data lifetime + migration time) > quantum horizon,
        # harvest-now-decrypt-later attacks are realistic -> bump quantum findings.
        if quantum:
            finding["mosca"] = {
                "data_lifetime_years": self.data_lifetime,
                "migration_years": self.migration_years,
                "quantum_horizon_years": self.quantum_horizon,
                "total_years": self.data_lifetime + self.migration_years,
                "high_risk": self.mosca_high,
            }
            if self.mosca_high and SEVERITY_RANK[severity] > SEVERITY_RANK["High"]:
                finding["severity"] = "High"

        self.findings.append(finding)

    # ------------------------------------------------------------------ file walk
    def scan(self) -> None:
        for path in sorted(self.root.rglob("*")):
            if not path.is_file():
                continue
            if any(part in SKIP_DIRS for part in path.parts):
                continue
            rel = str(path.relative_to(self.root))
            if any(fnmatch(rel, pat) or fnmatch(path.name, pat) for pat in self.exclude):
                continue
            ext = path.suffix.lower()
            if ext in CERT_EXTENSIONS:
                self.files_scanned += 1
                self.scan_crypto_file(path, rel)
            elif ext in SCAN_EXTENSIONS or path.name in SPECIAL_FILENAMES:
                self.files_scanned += 1
                self.scan_text_file(path, rel)

    # ------------------------------------------------------------------ text files
    def scan_text_file(self, path: Path, rel: str) -> None:
        try:
            source = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            return
        lines = source.splitlines()

        if path.suffix == ".py":
            docstring_lines = self.collect_docstring_lines(source)
            self.scan_python_ast(rel, source, lines)
        else:
            docstring_lines = set()

        compiled = [(r, re.compile(r.pattern, re.IGNORECASE if r.ignore_case else 0)) for r in RULES
                    if not r.exts or path.suffix.lower() in r.exts]

        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            if not stripped or idx in docstring_lines:
                continue
            if any(re.match(p, stripped) for p in SKIP_LINE_PATTERNS):
                continue

            emitted_this_line: set[str] = set()
            for rule, rx in compiled:
                for m in rx.finditer(line):
                    # nginx-style negation: !MD5 means MD5 is *excluded*
                    if m.start() > 0 and line[m.start() - 1] == "!":
                        continue
                    # avoid double-reporting DES inside 3DES constructs on the same line
                    if rule.algorithm == "DES" and "3DES" in emitted_this_line:
                        continue
                    key_size = None
                    if rule.algorithm == "RSA":
                        key_size = self.extract_rsa_size(line)
                    elif rule.key_group and m.group(rule.key_group):
                        key_size = int(m.group(rule.key_group))
                    if rule.algorithm == "AES":
                        algorithm = {128: "AES-128", 256: "AES-256"}.get(key_size, "AES")
                    else:
                        algorithm = rule.algorithm
                    emitted_this_line.add(algorithm)
                    self.emit(rel, idx, algorithm, key_size, line)

    @staticmethod
    def collect_docstring_lines(source: str) -> set[int]:
        """Line spans of module/class/function docstrings — prose, not code."""
        spans: set[int] = set()
        try:
            tree = ast.parse(source)
        except SyntaxError:
            return spans
        for node in ast.walk(tree):
            if isinstance(node, (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
                body = node.body
                if (body and isinstance(body[0], ast.Expr)
                        and isinstance(body[0].value, ast.Constant)
                        and isinstance(body[0].value.value, str)):
                    start = body[0].lineno
                    end = body[0].end_lineno or start
                    spans.update(range(start, end + 1))
        return spans

    @staticmethod
    def extract_rsa_size(line: str) -> int | None:
        for pat in RSA_SIZE_PATTERNS:
            m = re.search(pat, line)
            if m:
                return int(m.group(1))
        return None

    # ------------------------------------------------------------------ python AST
    def scan_python_ast(self, rel: str, source: str, lines: list) -> None:
        try:
            tree = ast.parse(source)
        except SyntaxError:
            return

        aliases: dict[str, str] = {}
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for a in node.names:
                    aliases[(a.asname or a.name).split(".")[0]] = a.name
            elif isinstance(node, ast.ImportFrom):
                mod = node.module or ""
                for a in node.names:
                    aliases[a.asname or a.name] = f"{mod}.{a.name}".lstrip(".")

        def dotted(n):
            parts = []
            while isinstance(n, ast.Attribute):
                parts.append(n.attr)
                n = n.value
            if isinstance(n, ast.Name):
                parts.append(aliases.get(n.id, n.id))
                return ".".join(reversed(parts))
            return None

        def const_str(node):
            return node.value if isinstance(node, ast.Constant) and isinstance(node.value, str) else None

        CURVE_SIZES = {"secp256r1": 256, "prime256v1": 256, "p256": 256, "secp384r1": 384, "secp521r1": 521}
        TLS_PROTO = {"protocol_tlsv1": "TLS 1.0", "protocol_tlsv1_1": "TLS 1.1", "protocol_tlsv1_2": "TLS 1.2"}
        HASH_NAMES = {"md5": "MD5", "sha1": "SHA-1", "sha256": "SHA-256", "sha512": "SHA-512"}

        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            name = dotted(node.func)
            if not name:
                continue
            low = name.lower()
            line = node.lineno
            src_line = lines[line - 1] if line - 1 < len(lines) else ""

            all_args = list(node.args) + [k.value for k in node.keywords]
            arg_dotted = [dotted(a) or "" for a in all_args]

            if low.endswith("hashlib.md5") or low == "md5":
                self.emit(rel, line, "MD5", None, src_line)
            elif low.endswith("hashlib.sha1") or low == "sha1":
                self.emit(rel, line, "SHA-1", None, src_line)
            elif low.endswith("hashlib.sha256") or low == "sha256":
                self.emit(rel, line, "SHA-256", None, src_line)
            elif low.endswith("hashlib.sha512") or low == "sha512":
                self.emit(rel, line, "SHA-512", None, src_line)
            elif low.endswith("hashlib.new"):
                h = const_str(node.args[0]) if node.args else None
                if h and h.lower() in HASH_NAMES:
                    self.emit(rel, line, HASH_NAMES[h.lower()], None, src_line)
            elif low.endswith("des.new"):
                self.emit(rel, line, "DES", None, src_line)
            elif low.endswith("arc4.new") or low.endswith("arc2.new"):
                self.emit(rel, line, "RC4", None, src_line)
            elif low.endswith("aes.new"):
                self.emit(rel, line, "AES", None, src_line)
            elif low.endswith("rsa.generate"):
                size = node.args[0].value if node.args and isinstance(node.args[0], ast.Constant) else None
                self.emit(rel, line, "RSA", size, src_line)
            elif low.endswith("rsa.generate_private_key"):
                size = None
                for k in node.keywords:
                    if k.arg == "key_size" and isinstance(k.value, ast.Constant):
                        size = k.value.value
                self.emit(rel, line, "RSA", size, src_line)
            elif low.endswith("ec.generate_private_key"):
                size = 256
                for a in arg_dotted:
                    for curve, s in CURVE_SIZES.items():
                        if curve in a.lower():
                            size = s
                self.emit(rel, line, "ECDSA", size, src_line)
            elif low.endswith("sslcontext") or low.endswith("wrap_socket"):
                for a in arg_dotted:
                    proto = TLS_PROTO.get(a.lower().split(".")[-1])
                    if proto:
                        self.emit(rel, line, proto, None, src_line)

            # block-mode detection on cipher constructor calls
            for a in arg_dotted:
                tail = a.lower().split(".")[-1]
                if tail == "mode_ecb":
                    self.emit(rel, line, "ECB mode", None, src_line)
                elif tail == "mode_cbc":
                    self.emit(rel, line, "CBC mode", None, src_line)

    # ------------------------------------------------------------------ certs & keys
    def scan_crypto_file(self, path: Path, rel: str) -> None:
        try:
            from cryptography import x509
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.primitives.asymmetric import dsa, ec, ed25519, rsa
        except ImportError:
            print("warning: 'cryptography' not installed — skipping cert/key analysis "
                  "(pip install cryptography)", file=sys.stderr)
            return

        data = path.read_bytes()
        now = datetime.now(timezone.utc)

        def key_info(pub):
            if isinstance(pub, rsa.RSAPublicKey):
                return "RSA", pub.key_size
            if isinstance(pub, ec.EllipticCurvePublicKey):
                return "ECDSA", pub.curve.key_size
            if isinstance(pub, (dsa.DSAPublicKey,)):
                return "DSA", pub.key_size
            if isinstance(pub, (ed25519.Ed25519PublicKey,)):
                return "Ed25519", 256
            return "Unknown", None

        def begin_line(marker: str) -> int:
            for i, ln in enumerate(path.read_text(errors="replace").splitlines(), 1):
                if marker in ln:
                    return i
            return 1

        # ---- X.509 certificate ----
        try:
            cert = x509.load_pem_x509_certificate(data)
        except ValueError:
            cert = None

        if cert is not None:
            algo, size = key_info(cert.public_key())
            line = begin_line("BEGIN CERTIFICATE")

            self.emit(rel, line, algo, size,
                      f"certificate CN={cert.subject.rfc4514_string()} key={algo}-{size}")

            sig = cert.signature_algorithm_oid._name.lower()
            if "sha1" in sig or "md5" in sig:
                self.emit(rel, line, "SHA-1" if "sha1" in sig else "MD5", None,
                          f"certificate signature algorithm {sig}")

            try:
                expiry = cert.not_valid_after_utc
            except AttributeError:
                expiry = cert.not_valid_after.replace(tzinfo=timezone.utc)
            if expiry < now:
                self.emit(rel, line, "X.509 expired", None,
                          f"certificate expired {expiry.date()} (CN={cert.subject.rfc4514_string()})")
                for fd in self.findings:
                    if fd["file"] == rel and fd["line"] == line and fd["algorithm"] == "X.509 expired":
                        fd["expires"] = expiry.date().isoformat()
            if cert.issuer == cert.subject:
                self.emit(rel, line, "X.509 self-signed", None,
                          f"self-signed certificate CN={cert.subject.rfc4514_string()}")
            return

        # ---- private key ----
        try:
            key = serialization.load_pem_private_key(data, password=None)
        except (ValueError, TypeError):
            return
        algo, size = key_info(key.public_key() if hasattr(key, "public_key") else key)
        line = begin_line("BEGIN")
        self.emit(rel, line, algo, size, f"private key {algo}-{size}")

    # ------------------------------------------------------------------ report
    def report(self, out_path: Path, fmt: str = "json") -> None:
        self.findings.sort(key=lambda f: (SEVERITY_RANK[f["severity"]], f["file"], f["line"]))
        if fmt == "sarif":
            out_path.write_text(json.dumps(self.to_sarif(), indent=2) + "\n")
        else:
            out_path.write_text(json.dumps(self.findings, indent=2) + "\n")
        self.print_summary(out_path, fmt)

    def print_summary(self, out_path: Path, fmt: str = "json") -> None:
        by_sev = {s: sum(1 for f in self.findings if f["severity"] == s) for s in SEVERITY_RANK}
        q = sum(1 for f in self.findings if f["quantum_vulnerable"])
        pct = round(100 * q / len(self.findings)) if self.findings else 0

        print("CipherScope scan complete")
        print(f"  files scanned      : {self.files_scanned}")
        print(f"  findings           : {len(self.findings)} "
              f"(Critical {by_sev['Critical']} · High {by_sev['High']} · "
              f"Medium {by_sev['Medium']} · Low {by_sev['Low']})")
        print(f"  quantum-vulnerable : {q}/{len(self.findings)} ({pct}%)")
        mosca = "HIGH" if self.mosca_high else "low"
        print(f"  mosca check        : {self.data_lifetime}y data + {self.migration_years}y migration "
              f"vs {self.quantum_horizon}y horizon -> {mosca} quantum risk")
        print(f"  wrote              : {out_path} ({fmt})")

    # ------------------------------------------------------------------ SARIF 2.1.0
    def to_sarif(self) -> dict:
        """SARIF 2.1.0 for GitHub code scanning upload (actions/upload-artifact compatible)."""
        level = {"Critical": "error", "High": "error", "Medium": "warning", "Low": "note"}
        rules: dict[str, dict] = {}
        for f in self.findings:
            rules.setdefault(f["algorithm"], {
                "id": f["algorithm"],
                "shortDescription": {"text": f"{f['algorithm']} detected ({f['category']})"},
                "fullDescription": {"text": f["recommendation"]},
                "help": {"text": f["recommendation"], "markdown":
                         f"**{f['algorithm']}** — {f['recommendation']}"},
                "properties": {
                    "category": f["category"],
                    "weak_today": f["weak_today"],
                    "quantum_vulnerable": f["quantum_vulnerable"],
                },
            })
        results = []
        for f in self.findings:
            results.append({
                "ruleId": f["algorithm"],
                "level": level[f["severity"]],
                "message": {"text": f"{f['algorithm']}"
                                    f"{'-' + str(f['key_size']) + '-bit' if f['key_size'] else ''}"
                                    f" in {f['file']}:{f['line']} — {f['recommendation']}"},
                "locations": [{
                    "physicalLocation": {
                        "artifactLocation": {"uri": f["file"].replace("\\", "/")},
                        "region": {"startLine": max(f["line"], 1)},
                    }
                }],
                "partialFingerprints": {"cipherscope/v1": f"{f['file']}:{f['line']}:{f['algorithm']}:{f['key_size']}"},
                "properties": {"severity": f["severity"], "weak_today": f["weak_today"],
                               "quantum_vulnerable": f["quantum_vulnerable"]},
            })
        return {
            "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
            "version": "2.1.0",
            "runs": [{
                "tool": {
                    "driver": {
                        "name": "CipherScope",
                        "version": __version__,
                        "informationUri": TOOL_URI,
                        "rules": list(rules.values()),
                    }
                },
                "results": results,
            }],
        }


# --------------------------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(
        prog="cipherscope",
        description="CipherScope — cryptographic discovery & PQC-readiness scanner")
    ap.add_argument("directory", help="directory to scan")
    ap.add_argument("-o", "--output", default="findings.json", help="output path (default: findings.json)")
    ap.add_argument("--format", choices=["json", "sarif"], default="json",
                    help="output format: json array or SARIF 2.1.0 (GitHub code scanning)")
    ap.add_argument("--data-lifetime", type=float, default=10, help="years data must stay secret (Mosca X)")
    ap.add_argument("--migration-years", type=float, default=6, help="years needed to migrate (Mosca Y)")
    ap.add_argument("--quantum-horizon", type=float, default=15, help="years until CRQC assumed (Mosca Z)")
    ap.add_argument("--exclude", action="append", default=[],
                    help="glob to skip, e.g. --exclude 'vendor/*' (repeatable)")
    ap.add_argument("--fail-on-critical", action="store_true",
                    help="exit 1 when any Critical finding is present (CI gate)")
    ap.add_argument("--version", action="version", version=f"CipherScope {__version__}")
    args = ap.parse_args()

    root = Path(args.directory).resolve()
    if not root.is_dir():
        print(f"error: {root} is not a directory", file=sys.stderr)
        return 2

    scanner = Scanner(root, args.data_lifetime, args.migration_years, args.quantum_horizon,
                      exclude=args.exclude)
    scanner.scan()

    out_path = Path(args.output).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    scanner.report(out_path, args.format)

    if args.fail_on_critical and any(f["severity"] == "Critical" for f in scanner.findings):
        print("CI gate: Critical findings present — failing (--fail-on-critical)", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
