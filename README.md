# AppleWebsiteFunToUse

An Apple-inspired shopping simulator built for the feeling of choosing something new. All transactions and deliveries are fictional. No payment processor, real Apple account, email service, or shipping provider is connected.

## Included

- Responsive Apple-style storefront with locally bundled product photography.
- Seven configurable products, finish swatches, storage/model options, and simulated AppleCare+.
- Search, saved products, shopping bag, quantity controls, and repeat purchases.
- Refillable $25,000 play-money wallet, cent-accurate totals, simulated 8.25% tax, and standard/express shipping.
- Complete checkout, order confirmation, persistent order history, weekday delivery estimates, and automatic tracking milestones.
- Optional fast-forward through deliveries, cancellation/refunds before shipping, and animated package unboxing.
- Keyboard-accessible dialogs and controls, reduced-motion support, and optional confirmation sound.

## Run locally

Requires Node.js 20 or later. No dependencies or installation are required.

```sh
npm run dev
```

Open http://127.0.0.1:4173. Run `npm test` for checkout, balance, persistence, cancellation, and delivery timeline tests. Run `npm run build` to verify the static deployment files.

## Vercel

Import this repository. `vercel.json` selects the Other preset, runs `npm run build`, and serves `dist/`. No environment variables are required. Hash-based routes work directly on static hosting.

The deployed storefront can be visited by anyone with its URL unless Vercel access protection is separately configured. Each browser has an independent wallet, bag, and order history; no shopping data is uploaded to a server. Clearing browser data resets the simulator. It is not an account system or cross-device store.

## Simulation details

Amounts use integer cents. Delivery estimates are fixed when an order is placed, skip weekends, and use the browser's local time. They are illustrative and do not integrate carrier holidays, inventory, or actual shipping. Product configurations and prices are for this simulation. The fast-forward control changes only the local simulation clock and affects all orders; the wallet offers a return-to-today control. Browsers with blocked local storage can use a temporary session.

## Attribution

Independent fan project; not affiliated with or endorsed by Apple. Apple trademarks and product imagery belong to Apple. Public source image URLs are recorded in `dist/assets/sources.json`. No Apple website scripts, trackers, account forms, or checkout endpoints are included.
