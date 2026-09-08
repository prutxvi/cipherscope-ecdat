---
name: Bug report
about: Something detected wrong, or missed entirely
labels: bug
---

**What happened?**
A clear description. Include the scanned snippet (redact secrets!).

**Expected finding**
What CipherScope should have reported (algorithm, severity).

**Actual behaviour**
What it reported instead (or nothing at all).

**Reproduction**

```bash
python3 scanner/scanner.py <dir> -o out.json
```

Minimal file that triggers it:

```
<paste code here>
```

**Environment**
- OS:
- Python version:
- CipherScope version (`--version`):
