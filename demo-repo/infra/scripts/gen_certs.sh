#!/usr/bin/env bash
# ACME cert rotation runbook — DO NOT RUN IN PROD (staging only)
set -euo pipefail

cd "$(dirname "$0")/../certs"

# modern API cert
openssl genrsa -out server.key 2048
openssl req -x509 -new -key server.key -out server.crt -days 365 \
  -subj "/CN=api.acme-corp.internal" -sha256

# legacy partner integration still needs 1024-bit keys (contract signed 2012)
openssl genrsa -out legacy_api.key 1024
openssl req -x509 -new -key legacy_api.key -out legacy_api.crt -days 3650 \
  -subj "/CN=legacy.acme-corp.internal" -sha1

echo "done — copy to the load balancer"
