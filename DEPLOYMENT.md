# DEPLOYMENT.md

Deployment guide for the SelfieStyler iframe app (`shopify_react`).

---

## Overview

This is a **Vite + React** single-page application served as static files. There is no Node.js process running in production — nginx serves the `dist/` build output and proxies the two API backends.

---

## Server Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js     | 18 LTS or higher |
| npm         | bundled with Node |
| nginx       | 1.18+ |
| GitHub Actions self-hosted runner | latest |

---

## Initial Server Setup

### 1. Clone the repo into the web root

```bash
git clone https://github.com/SelfieStyler/shopify-iframes.git /var/www/mysurefit-iframes.com
cd /var/www/mysurefit-iframes.com
npm ci
npm run build
```

### 2. Install and configure the GitHub Actions self-hosted runner

Follow GitHub's instructions at **Settings → Actions → Runners → New self-hosted runner** for the `SelfieStyler/shopify-iframes` repository.

Install the runner as a systemd service so it survives reboots:

```bash
# Inside the runner directory after ./config.sh
sudo ./svc.sh install
sudo ./svc.sh start
```

### 3. Allow the runner to reload nginx without a password

Add the following line via `sudo visudo`:

```
github ALL=(ALL) NOPASSWD: /usr/sbin/nginx -s reload
```

Replace `github` with the OS user the runner runs as.

---

## nginx Configuration

Create `/etc/nginx/sites-available/mysurefit-iframes` with the content below, then enable it:

```bash
sudo ln -s /etc/nginx/sites-available/mysurefit-iframes /etc/nginx/sites-enabled/
sudo nginx -t
sudo nginx -s reload
```

```nginx
server {
    listen 80;
    server_name mysurefit-iframes.com www.mysurefit-iframes.com;

    root /var/www/mysurefit-iframes.com/dist;
    index index.html;

    # --- API proxy: Core API (/v4) ---
    location /v4/ {
        proxy_pass         https://api.mysurefit.co/v4/;
        proxy_ssl_server_name on;
        proxy_set_header   Host              api.mysurefit.co;
        proxy_set_header   origin            https://2a9dc7.myshopify.com;
        proxy_set_header   referer           https://2a9dc7.myshopify.com/;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
    }

    # --- API proxy: Shopify Sync (/sync) ---
    location /sync/ {
        proxy_pass         https://shop-api.mysurefit.co/sync/;
        proxy_ssl_server_name on;
        proxy_set_header   Host              shop-api.mysurefit.co;
        proxy_set_header   origin            https://2a9dc7.myshopify.com;
        proxy_set_header   referer           https://2a9dc7.myshopify.com/;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
    }

    # --- Static assets (hashed filenames — cache aggressively) ---
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # --- SPA fallback — all other routes serve index.html ---
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> **HTTPS:** Wrap the above in an SSL server block using Let's Encrypt (`certbot --nginx`). The HTTP block should just redirect to HTTPS.

---

## CI/CD Pipeline

File: `.github/workflows/cicd.yaml`

On every push to `main` the self-hosted runner (on the production server) runs:

1. `git pull origin main` — fetches the latest code into `/var/www/mysurefit-iframes.com`
2. `npm ci` — installs exact dependency versions from `package-lock.json`
3. `npm run build` — Vite compiles the app into `dist/`
4. `sudo nginx -s reload` — reloads nginx to pick up any config changes (static files are served directly, so no restart is needed for code changes)

---

## Environment Variables

There are **no `.env` files required** at build time. All runtime configuration is handled server-side:

| Concern | How it's handled |
|---------|-----------------|
| API base URLs (`/v4`, `/sync`) | nginx `proxy_pass` (see above) |
| Shopify store `origin` header | nginx `proxy_set_header origin` |
| Auth token | Stored in `localStorage` by the browser at runtime |
| Session bootstrap (`fr_user_id`) | Hardcoded in `src/context/AuthContext.jsx` — replace with a real backend call when the Shopify app is installed |

---

## Updating the Shopify Store Origin

The Shopify store origin (`https://2a9dc7.myshopify.com`) appears in two places:

1. `vite.config.js` — for local development proxy only
2. nginx `proxy_set_header origin` — for production

When switching to a different Shopify store, update the nginx config and reload.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Blank page after deploy | `dist/` not rebuilt | SSH in, run `npm run build` manually |
| 404 on `/iframe/products` etc. | SPA fallback missing | Confirm `try_files $uri /index.html` is in nginx config |
| API calls return 502 | nginx proxy can't reach backend | Check `proxy_pass` URLs and firewall; test with `curl` from the server |
| Runner fails `nginx -s reload` | Missing sudoers entry | Add `NOPASSWD` line (see Initial Setup step 3) |
| `git pull` fails in pipeline | SSH key not configured | Add deploy key to GitHub repo and server's `~/.ssh/authorized_keys` |
