
// ---- plain-language maps for the judge-friendly UI ----

// What each algorithm IS, in one line
export const ALGO_TITLE = {
  'MD5': 'Passwords hashed with MD5',
  'SHA-1': 'Data fingerprints made with SHA-1',
  'SHA-256': 'Modern SHA-256 hashing',
  'SHA-384': 'Modern SHA-384 hashing',
  'SHA-512': 'Modern SHA-512 hashing',
  'DES': 'Data encrypted with DES',
  '3DES': 'Older triple-DES encryption',
  'RC4': 'Obsolete RC4 stream cipher',
  'AES': 'AES encryption',
  'AES-128': 'AES-128 encryption',
  'AES-256': 'AES-256 encryption (strongest)',
  'ECB mode': 'ECB mode — leaks patterns in data',
  'CBC mode': 'CBC mode — known padding attacks',
  'RSA': 'RSA keys / signatures',
  'ECDSA': 'ECDSA digital signatures',
  'ECDH': 'ECDH key exchange',
  'Ed25519': 'Ed25519 signatures',
  'DSA': 'Legacy DSA signatures',
  'DH-1024': 'Weak 1024-bit key exchange',
  'TLS 1.0': 'Connection uses banned TLS 1.0',
  'TLS 1.1': 'Connection uses banned TLS 1.1',
  'TLS 1.2': 'Connection uses older TLS 1.2',
  'TLS 1.3': 'Connection uses modern TLS 1.3',
  'X.509 expired': 'Certificate has EXPIRED',
  'X.509 self-signed': 'Self-signed certificate (untrusted)',
}

export const algoTitle = (a) => ALGO_TITLE[a] || `${a} usage found`

// friendly names for the filter chips
export const CATEGORY_FRIENDLY = {
  asymmetric: 'Keys & signatures',
  symmetric: 'Data encryption',
  hash: 'Passwords & hashing',
  protocol: 'Connection security',
  certificate: 'Certificates',
}
export const categoryFriendly = (c) => CATEGORY_FRIENDLY[c] || c

// short human name for the affected file
const FILE_MAP = [
  ['payments-api/auth.py', 'Payments API'],
  ['payments-api/app.py', 'Payments API'],
  ['payments-api/config/settings.yaml', 'Payments API settings'],
  ['CryptoUtil.java', 'User service (Java)'],
  ['edge-gateway/main.go', 'Edge gateway (Go)'],
  ['edge-gateway/handlers.go', 'Edge gateway (Go)'],
  ['legacy-reporting/md5_tool.c', 'Legacy reporting (C)'],
  ['notifications/notify.go', 'Notifications (Go)'],
  ['web-portal/src/crypto.js', 'Web portal (JS)'],
  ['nginx.conf', 'nginx edge server'],
  ['sshd_config', 'SSH server config'],
  ['Dockerfile', 'Container setup'],
  ['docker-compose.yml', 'Container setup'],
  ['infra/certs/legacy_api.crt', 'Certificates'],
  ['infra/certs/legacy_api.key', 'Certificates'],
  ['infra/certs/server.crt', 'Certificates'],
  ['infra/certs/server.key', 'Certificates'],
  ['infra/certs/payments_ec.crt', 'Certificates'],
  ['infra/scripts/gen_certs.sh', 'Cert scripts'],
]
export const fileFriendly = (file) => {
  const hit = FILE_MAP.find(([needle]) => file.includes(needle))
  return hit ? hit[1] : file
}

// order used for the "fix these first" section
export const PREF_ORDER = [
  'X.509 expired', 'MD5', 'DES', 'ECB mode', 'TLS 1.0',
  'TLS 1.1', 'RC4', 'RSA', 'DH-1024', '3DES', 'SHA-1', 'CBC mode',
]

// footer glossary — one line each
export const GLOSSARY = [
  ['Crypto / cryptography', 'The math used to keep data secret: encrypting passwords, credit cards, messages and connections.'],
  ['Weak today', 'Broken (or nearly broken) with ordinary computers available right now.'],
  ['Quantum-vulnerable', 'Safe today — but breakable by a future quantum computer. RSA and Elliptic Curve (ECDSA) keys are in this group.'],
  ['Quantum computer', 'A new kind of machine (~15 years away) that can crack the RSA/ECC math behind most modern encryption.'],
  ['PQC / Post-Quantum Cryptography', 'The new NIST-approved math (ML-KEM, ML-DSA) that quantum computers cannot crack.'],
  ['Mosca theorem', 'The race clock: data-lifetime + migration-time > quantum-horizon means you run out of time. Here: 10y + 6y > 15y → HIGH risk.'],
  ['Harvest now, decrypt later', 'Attackers already steal encrypted data today so they can decrypt it once quantum arrives.'],
]
