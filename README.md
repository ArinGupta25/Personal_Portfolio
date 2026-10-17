# Personal_Portfolio — a little world

A personal digital home: a whimsical scrapbook, workshop, reading room and atlas. Eight static pages share warm paper, forest ink, terracotta, lavender and butter yellow. The site is deliberately free of recruitment slogans and decorative statistics.

## Run locally

Requires Node.js 22 or later; no installation or dependencies required.

```sh
npm test
npm run build
npm start
```

Open http://127.0.0.1:4173. The build creates `dist/`; do not edit generated files.

## Content

Edit `content/site.json`. Empty collections are intentional: the owner requested the base first and will supply personal information later. The introductory copy is proposed design copy, not a verified biography. No destinations, qualifications, project completion claims or private contact details have been added.

Every collection item requires `published: true` to appear. This is an editorial inclusion flag, **not** access control: any content committed to a public repository is public, including items with `published: false`. Never commit private drafts, contact details or photos without permission.

Put approved photos in `assets/images/<collection>/<descriptive-name>.webp`, use meaningful alt text, and remove EXIF location metadata before publication. The starter illustration is CSS artwork, not a personal photograph. `assets/land.geojson` comes from Natural Earth (public domain), via https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson. Fonts load from Google Fonts with system fallbacks; self-host them if desired.

### Collection fields

All text is escaped. `body` is plain text with blank lines between paragraphs. No raw HTML is accepted. Use HTTPS for external links. `slug` is lowercase letters, numbers and hyphens, unique within its collection. Detail pages are generated for projects, writeups and travel.

| Collection | Fields besides published |
|---|---|
| photos | image, alt, caption |
| socials | title, url |
| projects | slug, title, category, status, summary, body, image, alt, demo, repository |
| organisations | title, period, status, role, body, url |
| writeups | slug, title, date, category, summary, body, image, alt |
| timeline | date (YYYY-MM-DD), title, category, body |
| travel | slug, title, country, date, lat, lon, summary, body, image, alt |
| services | title, body, url (example work) |
| education | title, institution, period, body, url, indicators (array of label/value objects) |

Top-level fields: `name`, `title`, `intro`, `about`, `email`. Name and email are empty until approved. Education indicators must be explicitly approved; no scores or completion percentages are calculated. Adding an approved email enables mailto inquiry drafts. This is not a message-delivery service: visitors review and send through their email app. No entries are stored or transmitted by the website.

## GitHub Pages

Source belongs in `ArinGupta25/Personal_Portfolio`. `.github/workflows/pages.yml` checks pull requests, builds on main and publishes the `dist` artifact. Set repository Settings → Pages → Source to **GitHub Actions**. The repository must have Pages available for its visibility/account plan. Relative URLs work under `/Personal_Portfolio/` and a custom domain. No application server is necessary.

Official setup: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

The workflow is prepared locally; successful hosted publication must be verified from an actual Actions run before claiming it is live.

## Updating through ChatGPT / Work

1. Ask for a change in natural language and identify this repository. Supply the content/photos and public-use approval.
2. The assistant reads `AGENTS.md`, edits content or reusable templates, runs tests and build, and previews the affected pages.
3. The assistant creates a branch, commit and pull request through connected GitHub access, then shares the change for review.
4. On an authorised merge into main, GitHub Actions deploys automatically. Verify the workflow and live URL.

Example: “Add this travel journal and these approved photos to Travel, and add a milestone to Timeline. Create a PR.” Repository access must remain connected in the conversation; natural-language updates are not a feature embedded in the public website.

## Architecture

- `scripts/build.mjs`: validation, reusable layouts, static page generation.
- `assets/style.css`: shared visual system and responsive page layouts.
- `assets/app.js`: accessible navigation, filters, search, photo viewer, atlas zoom and inquiry drafts.
- `content/site.json`: editable public content.
- `scripts/site.test.mjs`: draft exclusion, data validation, generated links and assets.
- `.github/workflows/pages.yml`: PR checks and main deployment.

There is no account system, analytics, database, paid service or secret required. Long-form text currently uses plain text paragraphs in JSON; Markdown parsing can be introduced when the writing archive needs richer formatting.
