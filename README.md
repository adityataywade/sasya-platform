# Sasya Innovations Platform

This workspace contains four independently buildable vanilla JavaScript/Vite applications:

- `apps/public-site` — public company and SCR Alpha A1 information site
- `apps/customer-portal` — customer-scoped robot view
- `apps/partner-portal` — setup and maintenance partner view
- `apps/admin-portal` — SCR Control Hub fleet view

The shared packages provide domain models, validation, Firebase initialization, telemetry providers, authentication helpers, and UI components. With no Firebase environment variables, each portal runs in explicitly labelled demo mode using the fixture records.

## Development

```bash
npm install
npm run dev:public
npm run dev:customer
npm run dev:partner
npm run dev:admin
```

Build all applications with `npm run build:all`. Use `.env.example` as the starting point for an app environment file. Firebase browser configuration is not an authorization secret; access must be enforced by Authentication and Realtime Database rules in `firebase/database.rules.json`.

## GitHub Pages

The repository includes [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml). After pushing the repository to GitHub, enable **Settings → Pages → Source: GitHub Actions**. Every push to `main` then builds and deploys all four sites into one Pages site:

- `https://YOUR-USER.github.io/YOUR-REPOSITORY/` — public site
- `https://YOUR-USER.github.io/YOUR-REPOSITORY/customer/` — customer portal
- `https://YOUR-USER.github.io/YOUR-REPOSITORY/partner/` — setup partner portal
- `https://YOUR-USER.github.io/YOUR-REPOSITORY/admin/` — SCR Control Hub

The public site's internal pages use hash navigation (for example `#/products`) so they work on GitHub Pages without a server rewrite. The portals currently run in demo mode and do not provide production authorization.

## Security and integration boundaries

Roles must be provisioned by a trusted workflow; the demo sign-in is not production authentication. Device ingestion, device identity, command protocols, and exact sensor units remain pending R&D confirmation. Remote commands are intentionally unavailable. Do not add public database writes to make the demo work.

Before Firebase integration, test rules in the Emulator Suite with positive and negative cases for customer, partner, admin, and device access. Production deployment also requires separate development, staging, and production Firebase projects.
