#!/usr/bin/env bash
# Runs on the VPS as root, started by scripts/deploy.sh after it uploads a
# release to the incoming folder. Order: configs, env, migrations, then swap
# in the new API and web. Any failure stops here and leaves the live app as is.
set -euo pipefail

INCOMING="/srv/fit-check/incoming"
APP="/srv/fit-check"
BACKUPS="$(mktemp -d)"
trap 'rm -rf "$BACKUPS"' EXIT

step() { printf '\n==> %s\n' "$1"; }
fail() {
  printf '\nDeploy stopped on the server: %s\n' "$1" >&2
  exit 1
}

[ "$(id -u)" -eq 0 ] || fail "run this as root (sudo)"

# Copies a repo config into /etc when it differs. Keeps a backup of the old
# file so a failed check can put it back. Returns 1 when nothing changed.
install_if_changed() {
  local source="$1" target="$2" mode="$3"
  if [ -f "$target" ] && cmp -s "$source" "$target"; then
    return 1
  fi
  if [ -f "$target" ]; then
    mkdir -p "$BACKUPS$(dirname "$target")"
    cp -p "$target" "$BACKUPS$target"
  fi
  install -D -o root -g root -m "$mode" "$source" "$target"
  echo "  updated $target"
}

restore() {
  local target="$1"
  if [ -f "$BACKUPS$target" ]; then
    cp -p "$BACKUPS$target" "$target"
  else
    rm -f "$target"
  fi
}

step "Configs"
nginx_changed=false
sshd_changed=false
systemd_changed=false
postgres_changed=false
changed_files=()
failed_checks=()

while IFS= read -r source; do
  target="${source#"$INCOMING/infra"}"
  install_if_changed "$source" "$target" 644 || continue
  case "$target" in
    /etc/nginx/*) nginx_changed=true ;;
    /etc/ssh/*) sshd_changed=true ;;
    /etc/systemd/*) systemd_changed=true ;;
    /etc/postgresql/*) postgres_changed=true ;;
  esac
  changed_files+=("$target")
done < <(find "$INCOMING/infra/etc" -type f | sort)

if [ "$nginx_changed" = true ] && ! nginx -t; then
  failed_checks+=("nginx")
fi
if [ "$sshd_changed" = true ] && ! sshd -t; then
  failed_checks+=("ssh")
fi
if [ "${#failed_checks[@]}" -gt 0 ]; then
  for target in "${changed_files[@]}"; do restore "$target"; done
  fail "invalid ${failed_checks[*]} config, all config changes were rolled back"
fi

[ "$systemd_changed" = true ] && systemctl daemon-reload
[ "$sshd_changed" = true ] && systemctl reload ssh
if [ "$postgres_changed" = true ]; then
  echo "  restarting Postgres for its new settings"
  systemctl restart postgresql
  for _ in $(seq 1 15); do
    pg_isready -q -h 127.0.0.1 && break
    sleep 1
  done
  pg_isready -q -h 127.0.0.1 || fail "Postgres did not come back after restarting"
fi
[ "${#changed_files[@]}" -eq 0 ] && echo "  no changes"

step "Env"
install_if_changed "$INCOMING/env" "$APP/.env" 600 || echo "  no changes"
rm -f "$INCOMING/env"

step "Migrations"
if ! systemctl start fit-check-migrate; then
  journalctl -u fit-check-migrate -n 30 --no-pager
  fail "migration failed, the live API was not touched"
fi
echo "  migrations applied"

step "API"
rsync -a --delete "$INCOMING/api/" "$APP/api/"
systemctl restart fit-check-api

# The API answers 401 on /auth/me without a session, which shows it is up and
# can route requests.
port="$(grep -E '^SERVER_PORT=' "$APP/.env" | cut -d= -f2)"
status=""
for _ in $(seq 1 15); do
  status="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}/auth/me" || true)"
  [ "$status" = "401" ] && break
  sleep 1
done
if [ "$status" != "401" ]; then
  journalctl -u fit-check-api -n 30 --no-pager
  fail "API health check failed (got '${status}', expected 401)"
fi
echo "  API is up"

step "Web"
rsync -a --delete "$INCOMING/web/" "$APP/web/"
if [ "$nginx_changed" = true ]; then
  systemctl reload nginx
  echo "  nginx reloaded"
fi
echo "  web updated"
