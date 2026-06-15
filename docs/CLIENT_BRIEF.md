# SelfieStyler: What Is Built and What Comes Next

## What We Have Built

A fully working virtual fitting room application, live at `mysurefit-iframes.com`.

It runs as three independent pages (iframes), each designed to be embedded inside a Shopify store:

| Iframe | URL | Purpose |
|--------|-----|---------|
| Products | `/iframe/products` | Browse collection, add items to fitting room |
| Models | `/iframe/models` | Pick a demo model to try clothes on |
| Fitting Room | `/iframe/fitting-room` | See clothes on the model, manage outfit |

All three are connected. Adding a product in the Products iframe instantly appears in the Fitting Room iframe. State is saved so it survives page reloads.

**The fitting room works end-to-end:**

Shopper browses products, clicks "Try it on", item is placed on their chosen model, model is shown wearing the item with correct layering (tops over bottoms), right panel shows the current outfit with size and color selectors.

## How a Shopify App Works

Before explaining next steps, here is what a Shopify App actually is:

When a merchant installs an app from the Shopify App Store, Shopify gives that app permission to read store data (products, customers, orders). The app can then inject UI blocks into the merchant's storefront automatically, without the merchant touching any code.

Our goal is to become one of those apps. When a merchant installs SelfieStyler, our fitting room iframes automatically appear on their product and collection pages.

## Step-by-Step: What Needs to Happen on Shopify

### Step 1: Register on Shopify Partners

**What:** Create a Shopify Partner account and register SelfieStyler as an official app.

**Where:** partners.shopify.com > Apps > Create App

**What comes out of this:**

- An **API Key** and **API Secret** that identify our app to Shopify
- An install URL that merchants click to install the app
- A redirect URL where Shopify sends the merchant after they approve the install

**No code needed yet. This is just registration.**

### Step 2: Build the OAuth Install Flow

**What:** When a merchant clicks "Install", Shopify runs an authentication handshake (OAuth). We need two routes in our backend to handle this.

**How it works:**

```
Merchant clicks Install
        |
Shopify redirects to our install URL with the shop name
        |
Our backend redirects merchant to Shopify's approval screen
        |
Merchant clicks "Approve"
        |
Shopify sends us a one-time code
        |
Our backend exchanges the code for a permanent access token
        |
We save the shop name and access token in our database
        |
App is installed. Merchant is redirected to a success page.
```

**Where this code lives:** The `shopify_sync` backend already has a starting point in `auth-shopify.js`. Two new routes are needed: one for install, one for the callback.

**What the access token lets us do:** Read the merchant's products, customers, and orders via Shopify's API.

### Step 3: Build the Theme App Extension

**What:** This is how our fitting room UI gets injected into the merchant's Shopify store automatically, without the merchant editing any theme code.

A Theme App Extension is a small package built with Shopify CLI that contains Liquid blocks. Shopify manages deploying these blocks when the app is installed.

**We create three blocks:**

**Block 1: Products Block** (goes on collection pages)
```
Merchant's Collection Page
  └── SelfieStyler Products Block
        └── iframe: /iframe/products?auth_token=...&fr_user_id=...
```

**Block 2: Models Block** (goes anywhere the merchant wants: header, sidebar, or as a modal trigger)
```
  └── iframe: /iframe/models?auth_token=...&fr_user_id=...
```

**Block 3: Fitting Room Block** (goes on the fitting room collection page or a dedicated page)
```
  └── iframe: /iframe/fitting-room?auth_token=...&fr_user_id=...
```

The merchant places these blocks wherever they want using Shopify's drag-and-drop theme editor. No code. No developer needed on their end.

### Step 4: Connect the Shopify Customer to the Fitting Room

**What:** This is the link between who is logged in on Shopify and whose fitting room they see.

Right now the app uses a test account. This step makes each shopper see their own fitting room.

**How it works inside the Theme App Extension:**

```
1. Shopper visits the store (logged into Shopify)
2. Shopify gives us the customer ID from the page
3. Our extension calls session/create with that customer ID
4. We get back an auth token and a fitting room user ID
5. We build the iframe URL with those values
6. Shopper sees their own fitting room
```

**What changes in our React app:** Instead of the hardcoded test session, `AuthContext.jsx` reads the auth token and user ID from the iframe URL params. Roughly 5 lines of code.

### Step 5: Test on a Real Shopify Store

**What:** Shopify Partners provides free development stores, test stores where you can install and test your app without a real merchant.

**Process:**

1. Create a development store in Shopify Partners
2. Install our app on that store using the install URL from Step 1
3. Add the Theme Extension blocks to the theme
4. Log in as a test customer and verify the full flow works end to end

### Step 6: Submit to the Shopify App Store

Once tested on a real store, submit the app for Shopify's review. Shopify reviews the app for security and quality, then publishes it. Merchants can then find and install it directly from the App Store.

## The Complete Picture

```
TODAY                         NEXT                        FUTURE
----------------------------------------------------------------

Iframes built & live          Step 1: Register on         App Store listing.
  Products iframe       -->     Shopify Partners    -->   Any merchant can
  Models iframe                                           install with
  Fitting Room iframe         Step 2: OAuth install       one click.
                                flow (backend)
CI/CD pipeline ready
Live at                       Step 3: Theme App
mysurefit-iframes.com           Extension (auto-inject
                                iframes into store)

                              Step 4: Session bridge
                                (real customer identity)

                              Step 5: Test on dev store
```

## What the Merchant Experience Looks Like (End Goal)

1. Merchant finds SelfieStyler on the Shopify App Store
2. Clicks "Add app", approves permissions, app is installed
3. Goes to their theme editor, sees SelfieStyler blocks available
4. Drags the "Fitting Room" block onto their collection page
5. Their shoppers now have a virtual fitting room with zero code

## Summary of Remaining Work

| Step | What | Effort |
|------|------|--------|
| 1 | Register on Shopify Partners | 1 hour, no code |
| 2 | OAuth install and callback routes | 2-3 days |
| 3 | Theme App Extension (3 iframe blocks) | 3-4 days |
| 4 | Session bridge (connect customer to iframe) | 1 day |
| 5 | Test on development store | 2-3 days |
| 6 | App Store submission | Shopify review: 1-2 weeks |

**The fitting room itself is done. Everything remaining is about packaging it as a proper Shopify App so any merchant can install it.**
