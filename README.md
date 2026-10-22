# Sasya Innovations Platform

This workspace contains four independently buildable vanilla JavaScript/Vite applications:

- `apps/public-site` — public company and SCR Alpha A1 information site
- `apps/customer-portal` — customer-scoped robot view
- `apps/partner-portal` — setup and maintenance partner view
- `apps/admin-portal` — SCR Control Hub fleet view

The shared packages provide domain models, validation, Firebase initialization, telemetry providers, authentication helpers, and UI components. With no Firebase environment variables, each portal runs in explicitly labelled demo mode using the fixture records.

For a plain-language map of the folders, important files, and request flow, see
[docs/PROJECT-GUIDE.md](./docs/PROJECT-GUIDE.md).

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

The public site's internal pages use hash navigation (for example `#/products`) so they work on GitHub Pages without a server rewrite. The customer and admin portals use Firebase Realtime Database when `VITE_DATA_MODE=firebase` and the Firebase environment variables are present. The live telemetry cards currently associate the direct `sensorData` payload with `SCR-001`, while also supporting robot-specific and nested `latest` records during migration. Add future robot branches such as `sensorData/SCR-002`; the cards can then be switched to that robot ID. Telemetry includes ESP8266 distance, temperature, humidity, motor, PWM, and Wi-Fi fields; authentication and deployed database rules remain required for production access.

The current ESP8266 sketch writes its single robot payload directly to `/sensorData`; the portals associate that payload with `SCR-001` until robot-specific branches are introduced. Ensure the sketch `DATABASE_URL` points to the same Sasya Firebase project configured in the portal environment. The sketch currently does not upload a device name, timestamp, or Wi-Fi field, so the UI reports the device as ESP8266, shows receipt time locally, and labels Wi-Fi as “Not sent” rather than inventing a hardware status.

For the ordered production migration, Firebase data contract, device security, and signed Cloudinary upload design, see [docs/PRODUCTION-MIGRATION.md](./docs/PRODUCTION-MIGRATION.md). Cloudinary API secrets must remain in a trusted backend; the browser client only uploads with a short-lived signature.

## Security and integration boundaries

Roles must be provisioned by a trusted workflow; the demo sign-in is not production authentication. Device ingestion, device identity, command protocols, and exact sensor units remain pending R&D confirmation. Remote commands are intentionally unavailable. Do not add public database writes to make the demo work.

Before Firebase integration, test rules in the Emulator Suite with positive and negative cases for customer, partner, admin, and device access. Production deployment also requires separate development, staging, and production Firebase projects.
