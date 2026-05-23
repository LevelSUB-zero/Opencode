---
name: publish-website
description: |
  Build and publish a website from user requirements or a reference URL.
  Generates a complete HTML/CSS/JS site and deploys it to Vercel with
  optional custom domain via the daemon's deploy API.
triggers:
  - "publish website"
  - "deploy site"
  - "create website"
  - "make a site"
  - "build landing page"
  - "publish to vercel"
  - "deploy to production"
  - "build from link"
od:
  mode: utility
  category: web-artifacts
---

# publish-website

Build a website from user requirements and deploy it automatically.

## Workflow

### Step 1 — Discover requirements

Ask the user what kind of site they want:

- **Landing page / hero site** — single-page marketing presence
- **Documentation / product page** — structured content with nav
- **SaaS landing** — pricing, features, testimonials, CTA
- **Blog / content site** — article-focused layout
- **Portfolio / showcase** — gallery-style personal site
- **Full app UI** — multi-page or dashboard-style interface
- **From a reference URL** — rebuild or clone a site from a link they provide

If the user provides a URL, fetch it and analyze:
- Overall structure and layout
- Color palette and typography
- Key sections and content patterns
- Responsive behavior

### Step 2 — Choose template or build from scratch

When the user describes what they want, check if an existing
design template matches:

- `saas-landing` — structured SaaS with typed inputs
- `web-prototype` — general-purpose landing page builder
- `pricing-page` — pricing table-focused
- `waitlist-page` — pre-launch waitlist
- `docs-page` — documentation layout
- `blog-post` — article page
- `live-dashboard` — data dashboard

If a template matches, use it as the starting structure. Otherwise
build from scratch with the design system tokens from the active
DESIGN.md.

### Step 3 — Build the site

Create a complete, production-ready website:

- **Single HTML file** — self-contained with inline CSS/JS when the site
  is a single page. Include viewport meta tag, favicon reference, and
  a clear document structure.
- **Multi-file project** — separate HTML, CSS, JS files when the site
  has multiple pages. Use relative paths between files.
- **Responsive** — works on mobile, tablet, and desktop.
- **Accessible** — semantic HTML, proper heading hierarchy, alt text
  on images, sufficient color contrast.
- **Fast** — minimal dependencies, optimized images, efficient CSS.

Write all files to the project working directory using clear descriptive
filenames. The entry point must be `index.html` for single-page sites.

### Step 4 — Auto-deploy to Vercel

After the site is built, deploy it automatically:

1. Construct the deploy payload for the project's entry HTML file.
2. The daemon will deploy the file through `POST /api/projects/:id/deploy`
   using the configured Vercel provider (`vercel-self`).
3. If the user provided a custom domain, include it in the deploy
   configuration for Vercel alias assignment.

The deployment is automatic — do not ask the user for permission
unless the deploy configuration (API token, team ID) is missing.
If configuration is missing, guide the user to add it in
Settings → Deploy → Vercel.

### Step 5 — Return the live URL

Once deployed, present the result to the user:

```
Your site is live:
  URL: https://<project>.vercel.app
  Custom domain: https://<domain> (if configured)
  Files: filename1.html, filename2.css, ...
```

If deployment fails, report the error clearly and suggest checking
the Vercel token and team configuration in Settings.

## Output format

The site files are written as project artifacts in the working directory.
The entry HTML is the deployment target. The agent includes a brief
summary of what was built and where it was deployed.

## Requirements

- User must have Vercel configured in Settings → Deploy (API token).
- For custom domains, the domain must already be added to the user's
  Vercel account.
- The daemon's `od deploy` CLI is also available for manual deployments.
