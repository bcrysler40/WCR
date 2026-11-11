# WorldCorp Realty – Marion & Citrus County Listings Map

Static interactive map of active listings with per-property QR lead capture.

- `index.html` – the map (also served at `/listings/`)
- Leads are emailed to bc@southernhl.co via FormSubmit.
- Deep link to a property: `/?home=<slug>` (QR codes use `&src=qr`).

No build step: Vercel serves the files as-is.
