# Chicken Pastil-Anne — Online Ordering Web App

**Tulog kana nakangiti kapa!**

A free, lightweight, mobile-first restaurant ordering web app — no backend, no build step, deployable on Vercel in under 5 minutes.

---

## Project Structure

```
pastil-anne/
├── index.html          # Main menu & ordering page
├── qr.html             # QR code generator & download page
├── vercel.json         # Vercel deployment config (cache headers, rewrites)
├── README.md           # This file
├── css/
│   └── style.css       # All styles (CSS variables at top for easy theming)
├── js/
│   └── app.js          # All JS logic (cart, menu render, order flow)
└── data/
    └── menu.json       # ALL menu data — edit this to update your menu
```

---

## Features

- **Mobile-first** responsive layout
- **Category navigation** with smooth scroll + auto-highlight on scroll
- **Add / remove / quantity controls** per item
- **Cart persists** via localStorage (survives page refresh)
- **Desktop sticky cart sidebar**
- **Mobile bottom cart bar + drawer**
- **Bestseller badges** and unavailable item state
- **Order modal** with:
  - Customer name, phone, address
  - Delivery / Pickup / Dine-in selection
  - Payment: GCash, PayMaya, COD, Cashier
  - Special notes
- **Auto-generates formatted order message** and redirects to **Facebook Messenger**
- **Toast notifications**
- **QR code page** (`qr.html`) — generates QR pointing to your site, downloadable as PNG with restaurant label
- **Print-friendly** QR page

---

## Editing the Menu

Open `data/menu.json` — every item and category is here:

```json
{
  "categories": [
    {
      "id": "unique-id",
      "name": "Category Name",
      "subtitle": "Optional subtitle",
      "icon": "bowl",       // bowl | chicken | jar | plate | fries | star | fork | trophy | combo
      "items": [
        {
          "id": "item-unique-id",
          "name": "Item Name",
          "description": "What's in it",
          "price": 99,
          "badge": "Bestseller",   // or "" for no badge, or "Buy 1 Take 1", "Best Value", etc.
          "available": true        // set false to show as unavailable
        }
      ]
    }
  ]
}
```

**To add a new item:** copy an existing item block, change the `id` (must be unique), update name/price/etc.

**To add a new category:** copy a category block, give it a new unique `id`.

---

## Customizing Colors & Fonts

Open `css/style.css` — all colors are at the top in `:root {}`:

```css
:root {
  --red:       #c0392b;   /* primary red */
  --gold:      #e8a020;   /* accent gold */
  --cream:     #fdf6ec;   /* light background */
  --warm-bg:   #1a0a04;   /* dark background */
  /* ... */
}
```

Change these hex values to retheme the entire site instantly.

---

## Updating Restaurant Info

Open `data/menu.json` and edit the `"restaurant"` block at the top:

```json
"restaurant": {
  "name": "Chicken Pastil-Anne",
  "tagline": "Tulog kana nakangiti kapa!",
  "address": "C. Mercado St (Cruz), Guiguinto, Philippines",
  "phone": "0909 059 8491",
  "gcash": "0909 059 8491",
  "facebook": "Chicken Pastil-Anne",   // Facebook page name (used for Messenger link)
  "currency": "₱",
  "deliveryFee": 50,
  "hours": {
    "Monday": "11:00 AM - 12:00 AM",
    "Sunday": "CLOSED"
  }
}
```

---

## Deploy to Vercel (Free — 5 Minutes)

### Method 1: Vercel CLI

```bash
# Install Vercel CLI (one time)
npm i -g vercel

# From inside the pastil-anne folder:
cd pastil-anne
vercel

# Follow prompts → your site will be live at:
# https://your-project-name.vercel.app
```

### Method 2: GitHub + Vercel Dashboard (recommended)

1. Create a free GitHub account at github.com
2. Create a new repository, upload all files from this folder
3. Go to vercel.com → Sign up free → "Add New Project"
4. Import your GitHub repository
5. Click **Deploy** — no build settings needed
6. Your site is live! Share the URL.

### Method 3: Drag & Drop

1. Go to vercel.com → Log in → "Add New Project"
2. Drag the entire `pastil-anne` folder onto the Vercel dashboard
3. Click Deploy

---

## Using the QR Code

1. Deploy the site first and get your Vercel URL
2. Open `your-url.vercel.app/qr.html`
3. The QR code auto-generates pointing to your menu
4. Click **Download PNG** to save a high-quality QR image with your restaurant name
5. Print and display at your store, flyers, tarpaulin, etc.

---

## How Orders Work

1. Customer browses menu, adds items to cart
2. Taps "Place Order via Messenger"
3. Fills in name, phone, address, order type, payment
4. Clicks "Send Order via Messenger"
5. Browser opens Facebook Messenger with a pre-filled order message
6. Customer sends the message to your Facebook page
7. You confirm, process, and collect payment via GCash / COD / etc.

**No payment gateway required.** Manual confirmation keeps it simple and free.

---

## Tech Stack

| Layer      | Tech                  |
|------------|-----------------------|
| Frontend   | HTML5, CSS3, Vanilla JS |
| Data       | JSON file             |
| QR Code    | QRCode.js (CDN)       |
| Fonts      | Google Fonts (CDN)    |
| Hosting    | Vercel (Free tier)    |
| Storage    | localStorage (cart)   |
| Backend    | **None**              |
| Database   | **None**              |
| Build step | **None**              |

---

## License

Free to use for your restaurant. No attribution required.

---

*Built with care for Chicken Pastil-Anne, Guiguinto, Philippines.*
