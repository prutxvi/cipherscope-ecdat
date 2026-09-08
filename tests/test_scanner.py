"""CipherScope scanner test suite.

Runs with unittest (stdlib, zero deps) and is pytest-compatible:
    python3 -m unittest discover -s tests -v
    uvx pytest tests -v
"""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scanner"))

import scanner as cs


def make_repo(files: dict[str, str]) -> Path:
    tmp = tempfile.mkdtemp(prefix="cipherscope-test-")
    root = Path(tmp)
    for name, content in files.items():
        p = root / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content)
    return root


def scan(files: dict[str, str], **kwargs) -> cs.Scanner:
    root = make_repo(files)
    s = cs.Scanner(root, **kwargs)
    s.scan()
    return s


def algos(s: cs.Scanner) -> list[str]:
    return [f["algorithm"] for f in s.findings]


class TestHashDetection(unittest.TestCase):
    def test_md5_python(self):
        s = scan({"a.py": "import hashlib\nhashlib.md5(b'x').hexdigest()\n"})
        self.assertIn("MD5", algos(s))
        f = next(f for f in s.findings if f["algorithm"] == "MD5")
        self.assertEqual(f["severity"], "Critical")
        self.assertTrue(f["weak_today"])
        self.assertEqual(f["category"], "hash")

    def test_sha1_java(self):
        s = scan({"A.java": 'MessageDigest md = MessageDigest.getInstance("SHA-1");\n'})
        self.assertIn("SHA-1", algos(s))

    def test_md5_in_docstring_ignored(self):
        s = scan({"a.py": 'def f():\n    """we mention md5 here but do not use it"""\n    return 1\n'})
        self.assertNotIn("MD5", algos(s))

    def test_sha256_is_low(self):
        s = scan({"a.py": "import hashlib\nhashlib.sha256(b'x').hexdigest()\n"})
        f = next(f for f in s.findings if f["algorithm"] == "SHA-256")
        self.assertEqual(f["severity"], "Low")
        self.assertFalse(f["quantum_vulnerable"])


class TestSymmetricDetection(unittest.TestCase):
    def test_des_ecb_python(self):
        s = scan({"a.py": "from Crypto.Cipher import DES\nc = DES.new(k, DES.MODE_ECB)\n"})
        self.assertIn("DES", algos(s))
        self.assertIn("ECB mode", algos(s))

    def test_3des_not_double_flagged_as_des(self):
        s = scan({"a.conf": 'ciphers: "DES-EDE3-CBC"\n'})
        self.assertIn("3DES", algos(s))
        self.assertNotIn("DES", algos(s))

    def test_rc4_nginx_negation_ignored(self):
        s = scan({"nginx.conf": "ssl_ciphers HIGH:!aNULL:!MD5;\n"})
        self.assertNotIn("MD5", algos(s))

    def test_aes_key_size_capture(self):
        s = scan({"a.conf": "cipher: AES-256-GCM\n"})
        f = next(f for f in s.findings if f["algorithm"] == "AES-256")
        self.assertEqual(f["key_size"], 256)


class TestAsymmetricDetection(unittest.TestCase):
    def test_rsa_1024_critical(self):
        s = scan({"a.py": "from Crypto.PublicKey import RSA\nk = RSA.generate(1024)\n"})
        f = next(f for f in s.findings if f["algorithm"] == "RSA")
        self.assertEqual(f["key_size"], 1024)
        self.assertEqual(f["severity"], "Critical")
        self.assertTrue(f["weak_today"])
        self.assertTrue(f["quantum_vulnerable"])

    def test_go_rsa_key_size(self):
        s = scan({"main.go": 'priv, err := rsa.GenerateKey(rand.Reader, 2048)\n'})
        f = next(f for f in s.findings if f["algorithm"] == "RSA")
        self.assertEqual(f["key_size"], 2048)

    def test_ecdsa(self):
        s = scan({"a.py": "import cryptography\nek = ec.generate_private_key(ec.SECP256R1())\n"})
        self.assertIn("ECDSA", algos(s))


class TestProtocolDetection(unittest.TestCase):
    def test_tls11_not_mistaken_for_tls10(self):
        s = scan({"nginx.conf": "ssl_protocols TLSv1.1;\n"})
        self.assertIn("TLS 1.1", algos(s))
        self.assertNotIn("TLS 1.0", algos(s))

    def test_tls10_and_11_together(self):
        s = scan({"nginx.conf": "ssl_protocols TLSv1 TLSv1.1 TLSv1.2;\n"})
        found = set(algos(s))
        self.assertIn("TLS 1.0", found)
        self.assertIn("TLS 1.1", found)
        self.assertIn("TLS 1.2", found)

    def test_ssh_weak_ciphers(self):
        s = scan({"sshd_config": "Ciphers aes128-cbc,3des-cbc,arcfour\nMACs hmac-sha1,hmac-md5\n"})
        found = set(algos(s))
        self.assertIn("RC4", found)
        self.assertIn("3DES", found)
        self.assertIn("MD5", found)


class TestMosca(unittest.TestCase):
    def test_mosca_high_bumps_rsa2048(self):
        s = scan({"a.py": "k = RSA.generate(2048)\n"})  # defaults: 10 + 6 > 15
        f = next(f for f in s.findings if f["algorithm"] == "RSA")
        self.assertEqual(f["severity"], "High")
        self.assertTrue(f["mosca"]["high_risk"])

    def test_mosca_low_keeps_medium(self):
        s = scan({"a.py": "k = RSA.generate(2048)\n"}, data_lifetime=2, migration_years=3)
        f = next(f for f in s.findings if f["algorithm"] == "RSA")
        self.assertEqual(f["severity"], "Medium")
        self.assertFalse(f["mosca"]["high_risk"])


class TestCertificates(unittest.TestCase):
    def _cert(self, key_size, not_after, sig_hash):
        from cryptography import x509
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.x509.oid import NameOID

        key = rsa.generate_private_key(public_exponent=65537, key_size=key_size)
        name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "test.local")])
        now = datetime.now(timezone.utc)
        return key, (x509.CertificateBuilder()
                     .subject_name(name).issuer_name(name)
                     .public_key(key.public_key())
                     .serial_number(x509.random_serial_number())
                     .not_valid_before(min(now - timedelta(days=1), not_after - timedelta(days=1)))
                     .not_valid_after(not_after)
                     .sign(key, sig_hash)).public_bytes(serialization.Encoding.PEM)

    def test_expired_cert_detected(self):
        from cryptography.hazmat.primitives import hashes
        _, pem = self._cert(1024, datetime(2022, 1, 1, tzinfo=timezone.utc), hashes.SHA256())
        s = {"infra/old.crt": pem.decode()}
        sc = scan(s)
        found = set(algos(sc))
        self.assertIn("X.509 expired", found)
        self.assertIn("RSA", found)
        rsa_f = next(f for f in sc.findings if f["algorithm"] == "RSA")
        self.assertEqual(rsa_f["key_size"], 1024)

    def test_valid_cert_no_expiry_finding(self):
        from cryptography.hazmat.primitives import hashes
        _, pem = self._cert(2048, datetime.now(timezone.utc) + timedelta(days=30), hashes.SHA256())
        sc = scan({"infra/ok.crt": pem.decode()})
        self.assertNotIn("X.509 expired", algos(sc))


class TestOutputFormats(unittest.TestCase):
    def test_sarif_structure(self):
        s = scan({"a.py": "import hashlib\nhashlib.md5(b'x')\n"})
        sarif = s.to_sarif()
        self.assertEqual(sarif["version"], "2.1.0")
        run = sarif["runs"][0]
        self.assertEqual(run["tool"]["driver"]["name"], "CipherScope")
        self.assertTrue(len(run["results"]) >= 1)
        r = run["results"][0]
        self.assertIn("ruleId", r)
        self.assertIn("physicalLocation", r["locations"][0])
        self.assertEqual(r["level"], "error")  # Critical -> error

    def test_json_report_is_array(self):
        s = scan({"a.py": "import hashlib\nhashlib.md5(b'x')\n"})
        self.assertIsInstance(json.dumps(s.findings), str)
        self.assertIsInstance(s.findings, list)


class TestCli(unittest.TestCase):
    def test_fail_on_critical_exit_code(self):
        import io
        from contextlib import redirect_stderr, redirect_stdout
        root = make_repo({"a.py": "import hashlib\nhashlib.md5(b'x')\n"})
        argv = sys.argv
        sys.argv = ["scanner.py", str(root), "-o", str(root / "out.json"), "--fail-on-critical"]
        try:
            with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                code = cs.main()
        finally:
            sys.argv = argv
        self.assertEqual(code, 1)

    def test_exclude_glob(self):
        s = cs.Scanner(make_repo({
            "src/a.py": "import hashlib\nhashlib.md5(b'x')\n",
            "vendor/b.py": "import hashlib\nhashlib.md5(b'x')\n",
        }), exclude=["vendor/*"])
        s.scan()
        self.assertTrue(all(not f["file"].startswith("vendor") for f in s.findings))


if __name__ == "__main__":
    unittest.main()
