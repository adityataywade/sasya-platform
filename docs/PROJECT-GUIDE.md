# Sasya project guide

This guide explains where the project code lives and how a page gets from the browser to
the shared services. The four portals are separate Vite applications, but they use the same
shared packages.

## Folder map

```text
sasya-project/
├── apps/
│   ├── public-site/       Public company and product pages
│   ├── customer-portal/   Customer view of assigned robots
│   ├── partner-portal/    Setup and maintenance partner view
│   └── admin-portal/      SCR Control Hub fleet view
├── packages/
│   ├── shared-ui/         Reusable visual components, styles, icons, and design tokens
│   ├── portal-ui/         Shared portal layout, screens, demo data flow, and live data flow
│   ├── domain-models/     Roles, statuses, fixtures, validation, and formatting helpers
│   ├── auth-service/      Demo sign-in and sign-out helpers
│   ├── firebase-client/   One shared Firebase app, Auth, and Realtime Database setup
│   ├── telemetry-service/ Telemetry provider interface and Firebase/demo implementations
│   └── cloudinary-client/ Browser-side handoff for signed image uploads
├── firebase/
│   ├── database.rules.json Firebase Realtime Database access rules
│   └── database.rules.test.js Basic rules-file sanity checks
├── docs/                  Operational and project documentation
├── .github/workflows/     GitHub Actions deployment workflow
└── package.json           Workspace scripts and common project settings
```

Generated `dist/` folders are build output. They are not the source of the website and should
not be edited by hand. Builds intentionally keep JavaScript unminified and include source maps
so the generated files are easier to inspect during development. This makes production files
larger, so minification can be enabled later for a production performance pass without changing
the source code. Local `.env.local` files contain machine-specific configuration and should
remain uncommitted.

## What the important files do

### Applications

- `apps/*/index.html` is the HTML shell loaded by Vite.
- `apps/*/src/main.js` is the entry point. The three portal entry points load shared styles
  and call `startPortal` with the appropriate role. The public entry point owns the public
  site's hash-based pages and estimate form.
- `apps/*/vite.config.js` keeps each application independently buildable and uses relative
  asset paths for deployments such as GitHub Pages.
- `apps/admin-portal/src/esp8266-sensor-dashboard.html` is a standalone sensor experiment. It
  is separate from the authenticated admin portal and reads the Firebase REST endpoint only
  when database rules permit it.

### Shared packages

- `packages/portal-ui/index.js` builds the portal shell, selects demo or Firebase data, renders
  role-specific screens, and wires sign-in, navigation, telemetry, and image-upload actions.
- `packages/shared-ui/components/` contains small UI builders such as headers, sidebars,
  tables, modals, status badges, and loading states.
- `packages/shared-ui/styles.css` contains the shared visual system.
- `packages/domain-models/fixtures.js` supplies predictable demo records used when Firebase is
  not configured.
- `packages/domain-models/constants.js` defines the allowed roles, robot states, task states,
  and telemetry fields.
- `packages/domain-models/validation.js` checks data before it is displayed or stored.
- `packages/firebase-client/index.js` is the only place that initializes Firebase. It returns
  demo mode when the required Vite environment values are missing.
- `packages/telemetry-service/` hides the difference between demo telemetry and live Firebase
  telemetry from the portal screens.

## Runtime flow

```mermaid
flowchart TD
    Browser[Browser opens an app] --> Entry[apps/*/src/main.js]
    Entry --> SharedStyles[shared-ui styles]
    Entry --> PublicPage{Public site?}
    PublicPage -->|yes| PublicRenderer[Public page renderer and estimate form]
    PublicPage -->|no| Portal[startPortal(role)]
    Portal --> Shell[portal-ui creates header, sidebar, and screen]
    Shell --> Mode{Firebase configured?}
    Mode -->|no| Demo[domain-models fixtures and demo auth]
    Mode -->|yes| Firebase[firebase-client]
    Firebase --> Auth[Firebase Authentication]
    Firebase --> Database[Realtime Database]
    Database --> Telemetry[telemetry-service]
    Demo --> Screens[Role-specific portal screens]
    Auth --> Screens
    Telemetry --> Screens
    Screens --> UI[shared-ui components]
    UI --> Browser
```

## Build and test flow

1. Run `npm install` once at the repository root.
2. Start one portal with `npm run dev:public`, `npm run dev:customer`,
   `npm run dev:partner`, or `npm run dev:admin`.
3. Without Firebase variables, verify the labelled demo mode and fixture data.
4. Build everything with `npm run build:all`.
5. Run the Firebase rules sanity check with `npm run test:rules`.
6. Deployments are defined in `.github/workflows/deploy-pages.yml`; the workflow builds the
   four applications and places them at the public, customer, partner, and admin paths.

The production migration details, including security boundaries and the planned data contract,
are in [PRODUCTION-MIGRATION.md](./PRODUCTION-MIGRATION.md).
