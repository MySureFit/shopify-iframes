# SelfieStyler — Iframe App

React-based virtual fitting room UI, designed to be embedded as iframes inside a Shopify storefront. Hosted at `mysurefit-iframes.com`.

## Local Development

```bash
npm install
npm run dev        # starts at http://localhost:3001
```

The dev server proxies API calls so you never need to deal with CORS locally:

| Path prefix | Proxied to |
|-------------|-----------|
| `/v4/*`     | `https://api.mysurefit.co` |
| `/sync/*`   | `https://shop-api.mysurefit.co` |

Both proxies inject `origin: https://2a9dc7.myshopify.com` on every request (required by the backend).

## Build & Deploy

```bash
npm run build      # outputs to dist/
```

Deployment is automated — pushing to `main` triggers the GitHub Actions pipeline which pulls, builds, and reloads nginx on the production server. See [DEPLOYMENT.md](./DEPLOYMENT.md) for full server setup.

## Architecture

Three independent iframe routes, each embeddable on a different Shopify page:

```
/iframe/products      → product browsing + add to fitting room
/iframe/models        → demo model selection
/iframe/fitting-room  → try-on canvas + outfit panel
```

All three share state through `localStorage` (`ss_fr` key). Cross-iframe sync happens via the browser `storage` event — writing in one iframe is immediately reflected in the others without any `postMessage` wiring.

```
src/
  api/
    coreApi.js        # axios client → /v4 (core API)
    syncApi.js        # axios client → /sync (Shopify sync API)
  context/
    AuthContext.jsx   # session token + login state
    FittingRoomContext.jsx  # products, model, morph state + localStorage persistence
  iframes/
    ProductsIframe.jsx      # collection page with filters
    ModelsIframe.jsx        # model grid + selection
    FittingRoomIframe.jsx   # fitting room canvas + outfit sidebar
  components/
    FittingRoomViewer.jsx   # Paper.js layer compositor
    IframeHeader.jsx
    ProductCard.jsx
    NavBar.jsx
  pages/
    LoginPage.jsx     # standalone login (not shown inside iframes)
    CollectionPage.jsx
    FittingRoomPage.jsx
```

## Session & Auth

Currently bootstrapped from a hardcoded `MOCK_SESSION_RESPONSE` in `AuthContext.jsx`. When wired to a real Shopify store, the theme will call `GET /sync/session/create?fr_user_id={customer_id}` and pass the returned `auth_token` + `fr_user_id` as iframe URL params.

- `isAuthenticated` — true when a session token exists (always true in current mock setup)
- `isLoggedIn` — true only after a real email/password login (guards the standalone `/` route)

## Key IDs

Two product IDs exist in the system — don't mix them:

| Field | Example | Used for |
|-------|---------|---------|
| `product_id` / `z_global_id` | `373043` | Fitting room API calls (add, remove, morph) |
| `shopify_product_id` | `8433452744986` | Shopify catalog reference |

`v3_product_id` in `FittingRoomContext` always holds the `z_global_id`.
