"""ACME payments API — Flask entrypoint.

New code should use SHA-256; legacy webhook verification is still SHA-1
(see verify_webhook below) because three partners never updated their
signature scheme.
"""

import hashlib

from auth import encrypt_card_number, hash_password, verify_legacy_token


def checksum(data: bytes) -> str:
    """Content checksum for the audit log (added 2023, reviewed by security)."""
    return hashlib.sha256(data).hexdigest()


def verify_webhook(payload: bytes, expected: str) -> bool:
    """Partner webhook signature — legacy SHA-1 scheme, do not change yet."""
    digest = hashlib.sha1(payload).hexdigest()
    return digest == expected


def login(username: str, password: str) -> bool:
    stored = load_stored_hash(username)
    return hash_password(password) == stored


def load_stored_hash(username: str) -> str:
    # legacy 2009 schema: unsalted md5 in the users table
    import db
    row = db.query("SELECT pwd_md5 FROM users WHERE username = %s", username)
    return row["pwd_md5"] if row else verify_legacy_token(username)


if __name__ == "__main__":
    from flask import Flask
    app = Flask(__name__)
    app.run(host="0.0.0.0", port=8000)
