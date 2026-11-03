# SS Regalis Reality

A full-stack Next.js 16 / React 19 / TypeScript property website, with an independently protected administration area, SQL persistence, and a progressively enhanced Three.js entrance.

## Local preview

Requires Node.js 22 LTS or newer and npm. Run commands from this directory:

```powershell
npm ci
# For a fresh checkout, copy .env.example to .env.local and generate SESSION_SECRET.
npm run dev
```

Open http://localhost:3000. This workspace already contains an ignored `.env.local` with a randomly generated session secret and `DEMO_MODE=true`. Do not commit that file. `npm run build` creates the production build; `npm start` serves it. Webpack is selected because this Windows sandbox prohibits the junction creation used by Turbopack.

### Administrator access

There are no default credentials or public signup. Provision the first owner from a trusted terminal:

```powershell
$env:ADMIN_EMAIL = 'your-real-email@example.com'
$securePassword = Read-Host 'Choose a password (12+ characters)' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
npm run admin:create
Remove-Item Env:ADMIN_PASSWORD
Remove-Item Env:ADMIN_EMAIL
```

Then visit `/admin/login`. This command also safely resets an existing account and invalidates its sessions. The CLI reads environment variables, not `.env.local`; set `DATABASE_URL` or `SQLITE_PATH` in the shell when targeting a non-default database. Never put passwords into source code or command-line arguments. Owners can manage settings and retention; `editor` users may manage properties and enquiries but not settings or retention. Additional user provisioning is intentionally a trusted operator function, not public registration.

Email password recovery requires verified SMTP settings. Reset tokens are random, hashed in storage, expire after 30 minutes, are single-use, and invalidate previous sessions. Without SMTP, the login screen accurately reports that recovery is not configured; the trusted CLI remains available.

### Demo data

```powershell
$env:DEMO_MODE = 'true'
npm run db:seed
```

The six seed records are labelled demonstrations, including in each card, detail page and description. Their prices, specifications and stock imagery are not real offers. Seed is idempotent. Set `DEMO_MODE=false` before launch; demo records are then excluded from public queries and details. They are always excluded from the sitemap. Admins can archive or replace them.

## Routes

Public: `/`, `/properties`, `/properties/[slug]`, `/about`, `/contact`, `/privacy-policy`, `/terms`, `/disclaimer`, `/robots.txt`, `/sitemap.xml`.

Admin: `/admin/login`, `/admin`, `/admin/properties`, `/admin/properties/new`, `/admin/properties/[id]/edit`, `/admin/enquiries`, `/admin/settings`.

The property directory supports URL-backed search, location, category, price, area with Indian unit conversion, applicable home specifications, utilities, verified approvals, amenities, availability, featured filtering, sorting, grid/list presentation, and server-side pagination. Hidden and archived listings are inaccessible publicly. Sold listings retain their identity and explicit status. Public pages are dynamically rendered from the database, so admin edits appear without deployment or stale application caching.

## Database and migrations

The data-access layer uses Knex with parameterized SQL:

- Local: SQLite at `./data/regalis.sqlite`, WAL mode and a five-second busy timeout.
- Production: PostgreSQL via `DATABASE_URL`. Set `DATABASE_SSL=true` for certificate-verified TLS where required.
- Schema version 1 is implemented in `src/lib/db.ts`, tracked by `schema_versions`, and creates properties, settings, users, enquiries, audit, limits, resets and aggregate-event tables. It runs transactionally on first use. `npm run db:migrate` applies it explicitly before deployment.
- Run the migration once before starting multiple production instances. Do not start simultaneous first-run schema migrations.
- Database indexes cover publication status, archive flag, category, price, normalized area, listing date and enquiry status/date. Search uses bounded database queries, not a downloaded inventory. For larger inventories, add PostgreSQL trigram indexes for substring matching after measuring the workload.
- Optimistic version checks prevent one editor from overwriting another’s property edits. Bulk updates also advance versions. Archive is reversible; no public permanent-property-delete endpoint exists. Media is retained when removing it from a listing or archiving a property, avoiding deletion of referenced assets.
- Back up the database and media together. Use managed PostgreSQL backups in production. SQLite requires a persistent volume and a single application instance; it is not suitable for ephemeral Vercel storage.

## Image storage

Uploads accept JPEG, PNG and WebP up to 10 MB, decode through Sharp with a pixel limit, strip metadata, resize to at most 2200px wide, and encode WebP. Names are generated server-side. SVG and arbitrary files are rejected. Administrators can upload multiple images, reorder them, choose a cover by moving it first, change alt text, remove, or replace images.

For production, configure S3-compatible storage with `S3_BUCKET`, `S3_REGION`, optional `S3_ENDPOINT`, standard AWS credentials and `S3_PUBLIC_URL` pointing to a public image CDN. Bucket credentials need only the relevant object prefix. Keep credentials server-only. Configure the CDN and bucket policies deliberately; the app does not modify account infrastructure.

For local development, uploads go to `./public/uploads`. `UPLOAD_DIR` can change the directory, but the host must serve it at `/uploads/`. In a production Node deployment, configure the reverse proxy or object CDN to serve newly uploaded files; do not depend on Next's build-time public-file inventory. Do not use local uploads on Vercel or other ephemeral/multi-instance hosting.

## Required configuration

See `.env.example` for every variable:

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Exact public origin, no trailing slash; CSRF checks, links and canonical URLs |
| `SESSION_SECRET` | Random secret of at least 32 characters; generate 32 random bytes or more |
| `DATABASE_URL`, `DATABASE_SSL` | Managed PostgreSQL connection and TLS |
| `SQLITE_PATH` | Local/persistent SQLite fallback path |
| `DEMO_MODE` | Explicit sample-listing visibility; set `false` at launch |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_PUBLIC_URL` | Object storage/CDN |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Server-only storage credentials; prefer workload identity where supported |
| `UPLOAD_DIR` | Local image directory, default `./public/uploads` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Verified recovery email transport |
| `TRUST_PROXY` | Enable only when the trusted proxy overwrites `x-forwarded-for` |

Business identity, phone, WhatsApp, office address, opening hours, social profiles, messages, SEO, company copy, logo and approved 3D model URL are edited under `/admin/settings`. Unconfigured contact and social links are hidden. All enquiries remain usable through the contact form. WhatsApp uses customer-initiated `wa.me` links; no WhatsApp API key is required. Maps use verified Google Maps links and optional coordinates, without inventing addresses.

## Branding and imagery

- `public/logo-original.png` is the user-supplied original, copied without alteration. It reads **SS REGALIS REALTY**. The written brief says **SS Regalis Reality**; confirm the business display name in settings before launch.
- Stock images from Unsplash are architectural inspiration, not property photographs. Seed records carry this disclosure. Replace them with licensed, verified listing photography before publication. See `ASSETS.md`.
- The default 6.5-second Three.js scene is an original **conceptual gateway**, explicitly labelled as not a temple reconstruction. It moves through a gateway into conceptual modern architecture. It is not the requested authenticated temple model: that remains dependent on a properly licensed, reviewed asset.
- Supply an approved GLB via the model URL setting after architectural/cultural review. Ensure it is centered at the origin, has a passable doorway, uses a reasonable scale, is optimized, and is served from an approved HTTPS asset origin. Add that origin to `connect-src` in the CSP for remote model loading (same-origin hosting avoids this step). Check camera alignment against the supplied model before launch.
- Intro skips on narrow devices, reduced-motion settings and data saver; remembers first visit; offers Skip; times out; catches WebGL/model failures; and never withholds server-rendered page content. No audio.
- No fabricated testimonials, company credentials, approval claims, or live inventory are included.

## Security and operations

Scrypt password hashes, encrypted HTTP-only SameSite sessions, secure cookies in production, eight-hour server-checked expiration, per-user session invalidation, database-backed rate limits, exact-origin mutation checks, Zod allowlists, SQL binding, role checks on protected APIs, safe output escaping, file decoding, audit events and optimistic edits are implemented. The CSP, no-sniff, frame denial and referrer policy are set in `next.config.ts`. Set HSTS at the TLS reverse proxy. Production uses HTTPS; secure cookies will not authenticate over plain HTTP.

Configure `TRUST_PROXY` correctly before launch. Without it, limits conservatively share the local bucket. With it, only trust a proxy that replaces client-supplied forwarding headers. Rate limiting is not a substitute for an upstream request-body limit/WAF. Configure a 12 MB body limit for image uploads and a much smaller limit for JSON routes. Review monitoring and backups for your deployment.

Enquiry data is private, never returned from public APIs and never put into click analytics. Owners can permanently purge closed enquiries older than a chosen date, with a 30-day minimum and confirmation. Set an actual retention policy, provider disclosures and contact details; the supplied privacy/terms copy is an operational draft requiring business/legal review before public launch. Do not collect unnecessary sensitive information in enquiry notes.

## Deployment

1. Provision managed PostgreSQL and image storage/CDN, and verified SMTP if recovery by email is required.
2. Set production variables, including HTTPS `SITE_URL`, strong `SESSION_SECRET`, `DEMO_MODE=false`, database/storage credentials and trusted proxy behavior.
3. Run `npm ci`, `npm run db:migrate`, `npm run typecheck`, `npm test`, and `npm run build`.
4. Provision an owner with the trusted CLI against the production database.
5. Deploy to a compatible Node host/container using `npm start`, or Vercel with PostgreSQL and S3 (never SQLite/local uploads). Build with the checked-in lockfile. Configure upstream body limits, TLS, backups, health checks and logs.
6. Add verified business details and original property photography; confirm brand spelling; replace or disable demo data. Review legal copy. Supply and review the temple model if required.
7. Run browser tests against a dedicated staging database with demo fixtures; validate actual SMTP, storage/CDN, map links and contact numbers. Do not run destructive test fixtures against real customer data.

This repository does not itself provision cloud accounts, register a domain, or publish a production deployment.

## Testing

```powershell
npm run typecheck
npm test
npm run build
# In a separate terminal: npm run dev
npm run test:e2e
```

Unit/database tests use isolated temporary SQLite databases. Browser tests use a dedicated Chrome profile via Playwright and expect the local seeded demo site at `http://localhost:3000`. They do not access a personal browser profile. Screenshots and failure traces go into ignored `test-results/`. See `QA.md` for executed checks and remaining external verification.

## Database-free Vercel demo
Vercel builds automatically enable the database-free demo when DATABASE_URL is unset. To explicitly enable it, set DATABASE_FREE_DEMO=true and redeploy. The build exposes the corresponding public flag consistently to server and browser code. Bundled src/lib/demo-data.json contains only sample properties and public business settings, not users or enquiries. Public listings, filters, property details, artwork and the intro work without SQLite or a session secret. Enquiry forms link to WhatsApp/email, analytics are discarded, and admin/edit/upload APIs are disabled. Set SITE_URL to your deployed HTTPS URL for canonical links. To enable the full application later, configure PostgreSQL, image storage and SESSION_SECRET and set DATABASE_FREE_DEMO=false before rebuilding.

### Supabase certificate chain errors
If Vercel logs show `self-signed certificate in certificate chain`, download the project's CA certificate from Supabase Database Settings > SSL Configuration. Set DATABASE_CA_CERT in Vercel to the full PEM certificate including BEGIN/END lines, keep DATABASE_SSL=true, and redeploy. This app retains certificate and hostname verification and prevents connection-string SSL options from overriding the supplied CA. The certificate is public; database passwords remain private.
