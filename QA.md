# Verification — 2 November 2026

## Landmark-inspired homepage redesign

Replaced the stock-photo hero with an original AI-generated Kanchipuram-inspired panorama, ivory/maroon typography, and responsive art positioning. Original logo and search functionality retained. Desktop (1440px) and mobile (390px) screenshots were visually inspected with no horizontal overflow. TypeScript passed and all five public browser tests passed after the redesign. The exact generation prompt is retained in `public/images/heritage-prompt.txt`; the art is a stylized interpretation rather than a verified reconstruction.

## Executed results

- `npm run build`: **passed**, with all public, admin and API routes compiled successfully using Webpack.
- `npm run typecheck`: passed after correcting a type annotation in the WebGL-failure test.
- `npm test`: **9 passed**, including schema validation, consent/honeypot checks, salted password verification, WhatsApp encoding, origin protection, SQL filtering/pagination, availability and archive visibility, optimistic update conflicts, rate limiting, demo exclusion and a 1,000-record inventory test with a bounded 12-record response.
- `npm run test:e2e`: **6 passed** in Chrome, in approximately 1.2 minutes. Tests used disposable administrator credentials and fixture records against the local development database.
- `npm audit --omit=dev --audit-level=high`: **0 vulnerabilities reported** after updating Nodemailer to 10.3.1. This is an advisory check, not a security certification.

## Browser coverage

1. Admin login; UI draft creation; hidden-listing protection; SVG upload rejection; valid PNG decoding and WebP upload; property edit; stale-version rejection; enquiry submission; private follow-up notes; sold filtering; archive/restore; settings synchronization; editor-role settings denial; session invalidation.
2. Public routes, category filtering, debounced search, property detail and fullscreen gallery, admin redirect, and homepage overflow checks/screenshots at 390, 768, 1440 and 1920 pixels.
3. Intro skip and first-visit persistence.
4. Unauthorized admin requests, cross-origin mutation rejection, invalid enquiry input and private API access.
5. Mobile filter dialog, URL-preserved budgets, grid/list switching, browser history, and directory/contact overflow checks at 390 pixels.
6. Intro completion and simulated unavailable WebGL with usable homepage fallback.

Desktop homepage screenshot was visually reviewed. Screenshots are in ignored `test-results/`; they are verification artifacts, not production assets.

## Issues found and resolved

- Windows sandbox prevented Turbopack junction creation; build/dev use Webpack. The build and browser runner needed approved unsandboxed execution for output directories and loopback access.
- Development CSP blocked Webpack evaluation. `unsafe-eval` is now allowed only in development, not production.
- Pre-hydration form submission and competing navigation caused lost interactions. Forms now guard readiness; private forms use POST and login/save navigation performs a fresh request.
- Conflicting native Sharp versions caused valid uploads to fail on Windows. Sharp is now aligned with Next.js at 0.35.5.
- The initial email dependency had an advisory; it was upgraded to the patched version.

## Remaining production verification and scope limits

- Managed PostgreSQL, S3/CDN and SMTP delivery have **not** been exercised with live credentials. SQLite persistence and local upload processing were tested. Run the integrations against staging before launch.
- The default entrance is an explicitly labelled conceptual gateway, **not** an accurate Sri Kanchi Kamakshi Amman Temple reconstruction. An approved licensed GLB, architectural review and camera alignment are still required for the requested temple experience.
- No real business phone, WhatsApp number, address, verified office map, social account or sale listing was provided. Configure these in admin. Contact actions remain hidden until configured; the enquiry form works locally.
- Display-name spelling needs confirmation: original logo says “Realty”; brief says “Reality”.
- Legal copy is an operational draft awaiting review for the business's actual practices.
- Category options are currently defined centrally in `src/lib/domain.ts`; arbitrary category creation is not exposed in admin. Location and approval filters use text inputs, not searchable comboboxes. Property detail pages have galleries; listing cards show cover images rather than an inline gallery carousel.
- Permanent property/media deletion is intentionally not exposed; recoverable archive is implemented. Orphaned media cleanup requires a deliberate storage maintenance policy.
- No Lighthouse/Core Web Vitals audit, real mid-range-device profiling, exhaustive accessibility audit, or production load test has been run. The 1,000-record check verifies bounded SQL pagination, not production throughput.
- Password reset logic and provisioning are implemented, but real email delivery is pending SMTP configuration.
- No cloud deployment, domain registration or public publication has been performed.

For setup, admin provisioning, environment variables, migrations, storage and deployment steps, see `README.md` and `.env.example`.
