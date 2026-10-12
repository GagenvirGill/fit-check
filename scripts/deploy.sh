#!/usr/bin/env bash
# Deploys fit-check to the VPS. Runs on the dev machine: checks the repo,
# builds, uploads everything to the server's incoming folder, then runs
# infra/apply.sh there as root (one sudo password prompt).
# Usage: npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="fitcheck" # SSH alias from ~/.ssh/config
INCOMING="/srv/fit-check/incoming"

step() { printf '\n==> %s\n' "$1"; }
fail() {
  printf '\nDeploy stopped: %s\n' "$1" >&2
  exit 1
}

step "Checking the repo"
[ -z "$(git status --porcelain)" ] || fail "there are uncommitted changes"
[ "$(git branch --show-current)" = "main" ] || fail "not on main"
git fetch --quiet origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] ||
  fail "main is not in sync with origin/main (push or pull first)"

step "Checking .env.prod"
[ -f .env.prod ] || fail ".env.prod is missing"
# The API's required variables, read from get-env.ts so this list can't drift.
required_keys=$(grep -oE 'required(Number)?Env\("[A-Z0-9_]+"\)' api/lib/get-env.ts |
  grep -oE '[A-Z0-9_]+"' | tr -d '"')
for key in API_ENV $required_keys; do
  grep -qE "^${key}=.+" .env.prod || fail ".env.prod has no value for ${key}"
done

step "Typecheck, lint and format"
npm run --silent typecheck
npm run --silent lint
npm run --silent format:check

step "Building"
npm run --silent api:build
npm run --silent web:build

step "Uploading to ${HOST}:${INCOMING}"
ssh "$HOST" "test -d ${INCOMING} && test -w ${INCOMING}" ||
  fail "${INCOMING} is missing or not writable. Create it once on the server with:
  sudo mkdir -p ${INCOMING} && sudo chown ubuntu:ubuntu ${INCOMING}"
rsync -az --delete dist/ "${HOST}:${INCOMING}/api/"
rsync -az --delete web/dist/ "${HOST}:${INCOMING}/web/"
rsync -az --delete infra/ "${HOST}:${INCOMING}/infra/"
rsync -az --chmod=F600 .env.prod "${HOST}:${INCOMING}/env"

step "Applying on the server (asks for your server password)"
ssh -t "$HOST" "sudo bash ${INCOMING}/infra/apply.sh"

printf '\nDeployed %s\n' "$(git log -1 --format='%h %s')"
