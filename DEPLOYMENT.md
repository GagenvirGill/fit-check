# Deployment

How fit-check is hosted, how to deploy it, and how to look after the server.

## Overview

Everything runs on one OVHcloud VPS (Ubuntu 26.04, Canada). The server only runs prebuilt output; all building happens on the dev machine.

```
fitcheck.gagen.co      ─HTTPS─▶ nginx ─▶ static files (/srv/fit-check/web)
api.fitcheck.gagen.co  ─HTTPS─▶ nginx ─▶ Node API (127.0.0.1:4000) ─▶ Postgres (127.0.0.1:5432)
r2.fitcheck.gagen.co   ─HTTPS─▶ Cloudflare R2 (images)
```

- **nginx** handles HTTPS, serves the web app and forwards API requests.
- **API** is a single bundled file (`server.cjs`), run by systemd.
- **Postgres** is only reachable from the server itself.
- **Outside the VPS:** images in Cloudflare R2, DNS on Cloudflare, the segmentation model on Hugging Face.

## Deploying

```
npm run deploy
```

It asks for the server password once. Steps, in order:

1. **Checks:** no uncommitted changes, on `main` and in sync with `origin/main`, `.env.prod` has every required value, then `typecheck`, `lint` and `format:check`.
2. **Build:** the API bundle and the web app (with precompressed `.br`/`.gz` files).
3. **Upload** to `/srv/fit-check/incoming` on the server.
4. **Apply** ([`infra/apply.sh`](infra/apply.sh)), as root:
   1. Server configs from `infra/etc/` that changed, then reload what they affect.
   2. `.env.prod` as the server's env, if it changed.
   3. Database migrations.
   4. New API code, restart, health check.
   5. New web files.

Any failure stops the deploy and leaves the live site running the previous version. A broken nginx or SSH config is rolled back automatically, and a failed migration happens before any code is replaced.

## Making Changes

| Change          | What to do                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Code            | Commit, push, `npm run deploy`.                                                                         |
| Database schema | Change the schema, `npm run db:generate`, commit, push, deploy. Migrations only ever run on the server. |
| Server config   | Edit the file under `infra/etc/`, commit, push, deploy.                                                 |
| Env values      | Edit `.env.prod`, deploy.                                                                               |

`infra/etc/` mirrors the server's `/etc`: `infra/etc/nginx/sites-available/fit-check` is `/etc/nginx/sites-available/fit-check`. A new file there is installed on the next deploy.

## Env Files and Secrets

| File        | Used by                                                                            |
| ----------- | ---------------------------------------------------------------------------------- |
| `.env.dev`  | `api:dev`, `web:dev`, `db:generate`, `db:migrate` (local database)                 |
| `.env.prod` | `web:build` (the `VITE_*` values) and the server (copied to `/srv/fit-check/.env`) |

Secrets, never committed:

- **`.env.prod`:** database password, JWT secret, Google and R2 keys.
- **Server password:** for `sudo` on the VPS.
- **SSH key:** `~/.ssh/id_ed25519`, used to log in.

Keep copies of these somewhere safe outside the repo. `.env.prod` also exists on the server, so either copy can restore the other (`sudo cat /srv/fit-check/.env`).

## The Server

| Path                                   | What                                                    |
| -------------------------------------- | ------------------------------------------------------- |
| `/srv/fit-check/api`                   | API bundle (`server.cjs`, `migrate.cjs`, `migrations/`) |
| `/srv/fit-check/web`                   | Web build                                               |
| `/srv/fit-check/.env`                  | Prod env, root-only                                     |
| `/srv/fit-check/incoming`              | Upload area for deploys                                 |
| `/etc/nginx/sites-available/fit-check` | nginx site                                              |

**Services:** `fit-check-api` (the API, restarts on crash and starts on boot), `fit-check-migrate` (runs migrations during a deploy), `nginx`, `postgresql`.

**Users:** you log in as `ubuntu` (has `sudo`). The API runs as `fitcheck`, which can't log in or change its own files.

**Runs by itself:**

- Firewall allows only SSH, HTTP and HTTPS.
- SSH accepts keys only; no passwords, no root login.
- Security updates install daily, including Node 24. The server reboots at 04:00 (UTC) when an update needs it.
- certbot renews the HTTPS certificate (named `fit-check`) and reloads nginx.

## Common Tasks

Log in with `ssh fitcheck`, an alias in `~/.ssh/config` for `ubuntu@<server IPv4>` with `~/.ssh/id_ed25519`. Then:

```
journalctl -u fit-check-api -f              # live API logs
journalctl -u fit-check-migrate -n 30       # last migration output
sudo tail -f /var/log/nginx/error.log       # nginx errors
sudo systemctl restart fit-check-api        # restart the API
psql "postgres://fitcheck@127.0.0.1/fitcheck"   # database shell
sudo certbot certificates                   # certificate names and expiry
sudo systemctl start fit-check-migrate      # run migrations by hand
```

**Not automated:**

- **Adding a domain:** add an `A` and `AAAA` record in Cloudflare (DNS only), add the name to `server_name` in the nginx config, then expand the certificate:
  `sudo certbot certonly --nginx --cert-name fit-check --expand -d api.fitcheck.gagen.co -d fitcheck.gagen.co -d <new name>`
- **Installing packages:** `sudo apt install ...`. Ubuntu packages and Node update themselves.

## Recovery

- **Bad deploy:** `git revert` the commit, push, deploy. Migrations only go forward, so a schema change needs a new migration to undo it.
- **Backups:** OVH keeps a daily backup of the whole server (last 24 hours only), restored from the OVH panel. Nightly database dumps to R2 are not set up yet.
- **Lost laptop or SSH key:** log in through the web console in the OVH panel as `ubuntu` with the server password, add the new public key to `~/.ssh/authorized_keys`, and get `.env.prod` from the server.
- **Server down:** reboot from the OVH panel. If it won't boot, use OVH's rescue mode.
- **New server:** not scripted yet. Install Node 24, nginx, certbot and Postgres, create the `fitcheck` user, the database and `/srv/fit-check/incoming` (owned by `ubuntu`), then deploy. All config comes from `infra/etc/`.

## Keep in Mind

- The API port is in two places: `SERVER_PORT` in `.env.prod` and `proxy_pass` in the nginx config.
- The API's database pool (`max: 5` in `packages/db/client.ts`) must stay well below Postgres's `max_connections` (20, in `infra/etc/postgresql/`).
