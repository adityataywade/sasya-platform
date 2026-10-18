# Demo-to-production migration

This checklist is the required order for moving Sasya from fixtures to real customer and robot data.

## 1. Create isolated Firebase projects

Create separate Firebase projects for `development`, `staging`, and `production`. Never test an ESP32 against production first. Enable Firebase Authentication and Realtime Database in each project. Cloudinary is separate and stores media; telemetry belongs in Realtime Database.

## 2. Register web applications

Register one web app per environment in Firebase and copy only the web configuration values into a local `.env.local` file. Browser Firebase values are not authorization secrets. Never add service-account JSON, private keys, or Admin SDK credentials to a Vite app or GitHub Pages.

```env
VITE_DATA_MODE=firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 3. Define the real data contract

Obtain written confirmation from the hardware team for robot ID ownership, timestamp units, sensor units, status values, reporting interval, and device authentication. The initial latest-telemetry path is:

```text
/robotLatest/{robotId}
```

Long-term events belong under:

```text
/robotEvents/{robotId}/{eventId}
```

Metadata, access assignments, maintenance records, and audit records must remain separate from high-frequency telemetry.

## 4. Provision users and roles

Create users through Firebase Authentication. Assign `customer`, `partner`, or `admin` through a trusted provisioning process. Do not let browser forms create or edit protected roles. Populate:

```text
/userProfiles/{uid}
/userRoles/{uid}
/customerRobotAccess/{uid}/{robotId}
/partnerRobotAccess/{uid}/{robotId}
```

The portal must use the authenticated Firebase user and load only records allowed by the database rules. Demo login is not production authentication.

## 5. Deploy restrictive rules before real data

Start from [firebase/database.rules.json](../firebase/database.rules.json), test with the Firebase Emulator Suite, and deploy only after positive and negative cases pass. Do not use `.read: true` or `.write: true` for customer or production data. Open rules allow anyone who knows the database URL to read, overwrite, or delete all records.

The ESP32 write path must be device-specific. A robot must not be able to change its robot ID and write another robot's path. If device authentication is not ready, use a disposable development project and a test robot only.

## 6. Connect the dashboard to live telemetry

The dashboard must create one shared telemetry service, subscribe to each permitted robot's `robotLatest/{robotId}` record, render the validated result, and unsubscribe when the view is removed. It must display `Unavailable`, `Waiting for first message`, `Stale`, or `Invalid payload` rather than converting missing values into zero or claiming that page load proves connectivity.

Validate the full path with a manually edited Firebase record before debugging firmware:

```text
Firebase record changes → dashboard changes without refresh
```

## 7. Test the ESP32 in development

Use one ID such as `SCR-TEST-001`. First send a fixed payload over Wi-Fi, then add one sensor at a time. Compare Serial Monitor, the Firebase record, and the dashboard value. Record timestamp units and sensor calibration. Start with a slow interval such as 10 seconds.

## 8. Configure signed Cloudinary uploads

Cloudinary stores images, not telemetry. Create separate Cloudinary environments or folders for development, staging, and production. Keep the Cloudinary API secret on a trusted backend only.

The browser client is [packages/cloudinary-client/index.js](../packages/cloudinary-client/index.js). It expects:

```env
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_SIGNING_ENDPOINT=https://api.example.com/cloudinary/sign
```

The signing endpoint must:

1. Verify the Firebase ID token or server session.
2. Check the user's role and permitted robot/task.
3. Restrict the folder, for example `sasya/robots/{robotId}/service`.
4. Generate a short-lived Cloudinary signature with the API secret.
5. Return only `timestamp`, `signature`, and the Cloudinary API key.

The browser then uploads directly to Cloudinary. Store only the returned `publicId`, `secureUrl`, owner/robot ID, uploader UID, and timestamps in Realtime Database. Do not trust a client-supplied robot ID without checking it on the signing endpoint.

## 9. Add a trusted backend

GitHub Pages cannot sign Cloudinary uploads, provision privileged users, validate device writes, or perform admin operations. Deploy those functions on a trusted platform such as Firebase Functions, Cloud Run, or another secured backend. Keep the Pages sites as frontend deployments.

## 10. Deploy

Build each app with the environment for the target environment. Store non-secret Firebase web configuration as GitHub Actions variables or build-time environment values. Store backend secrets, Cloudinary API secrets, and service credentials only in the backend/platform secret manager. Deploy the Pages workflow only after the production rules and backend are ready.

## Go-live acceptance

- Firebase Auth login and sign-out work.
- Role assignments are server-controlled.
- Customer and partner access cannot cross robot assignments.
- ESP32 writes are device-authenticated and schema-validated.
- Dashboard updates from Realtime Database without refresh.
- Stale and invalid telemetry is visible.
- Cloudinary signatures require authenticated authorized users.
- Images are stored by `publicId`, not as large base64 values in Realtime Database.
- Emulator security tests pass.
- Development, staging, and production projects are separate.
