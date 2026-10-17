# Personal_Portfolio — personal archive

A personal digital home with nine connected sections. The formal frontend uses a navy and neutral palette, clear editorial layouts, a profile-photo slot and restrained transitions. It remains a personal archive, not a recruitment site.

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

Put approved photos in `assets/images/<collection>/<descriptive-name>.webp`, use meaningful alt text, and remove EXIF location metadata before publication. The profile icon is a placeholder until a photograph is supplied. `assets/countries.geojson` uses Natural Earth public-domain country polygons, with names and alpha-3 codes, via https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson. Fonts load from Google Fonts with system fallbacks; self-host them if desired.

### Collection fields

All text is escaped. `body` is plain text with blank lines between paragraphs. No raw HTML is accepted. Use HTTPS for external links. `slug` is lowercase letters, numbers and hyphens, unique within its collection. Detail pages are generated for projects, writeups, travel and library books.

| Collection | Fields besides published |
|---|---|
| photos | image, alt, caption |
| socials | title, url |
| projects | slug, title, category, status, summary, body, image, alt, demo, repository |
| organisations | title, period, status, role, body, url |
| writeups | slug, title, date, category, summary, body, image, alt |
| library | slug, title, author, category, date, summary, body, image, alt, rating (optional 0–5) |
| timeline | date (YYYY-MM-DD), title, category, body |
| travel | slug, title, country, countryCode (ISO alpha-3), date, lat, lon, summary, body, image, alt |
| services | title, body, url (example work) |
| education | title, institution, period, body, url, indicators (array of label/value objects) |

Top-level fields: `name`, `title`, `intro`, `about`, `email`, `profile` (null or an image/alt object). Name and email are empty until approved. Education indicators must be explicitly approved; no scores or completion percentages are calculated. Adding an approved email enables mailto inquiry drafts. This is not a message-delivery service: visitors review and send through their email app. No entries are stored or transmitted by the website.

## GitHub Pages

Source belongs in `ArinGupta25/Personal_Portfolio`. `.github/workflows/pages.yml` checks pull requests, builds on main and publishes the `dist` artifact. Set repository Settings → Pages → Source to **GitHub Actions**. The repository must have Pages available for its visibility/account plan. Relative URLs work under `/Personal_Portfolio/` and a custom domain. No application server is necessary.

Official setup: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

GitHub Pages is configured for Actions. Verify each deployment run before reporting a new revision live.

## Updating through ChatGPT / Work

1. Ask for a change in natural language and identify this repository. Supply the content/photos and public-use approval.
2. The assistant reads `AGENTS.md`, edits content or reusable templates, runs tests and build, and previews the affected pages.
3. The assistant creates a branch, commit and pull request through connected GitHub access, then shares the change for review.
4. On an authorised merge into main, GitHub Actions deploys automatically. Verify the workflow and live URL.

Example: “Add this travel journal and these approved photos to Travel, and add a milestone to Timeline. Create a PR.” Repository access must remain connected in the conversation; natural-language updates are not a feature embedded in the public website.

## Architecture

- `scripts/build.mjs`: content validation and static generation.
- `scripts/templates.mjs`: shared homepage, collection, gallery and complete article layouts.
- `assets/style.css`: shared visual system and responsive page layouts.
- `assets/app.js`: navigation, combined filters/search, library views, overview panels, reading controls, galleries and inquiry drafts.
- `assets/map.js`: country selection, visited-country highlights, markers, zoom, pan and travel previews.
- `content/site.json`: editable public content.
- `scripts/site.test.mjs`: draft exclusion, data validation, generated links and assets.
- `.github/workflows/pages.yml`: PR checks and main deployment.

There is no account system, analytics, database, paid service or secret required. Long-form text currently uses plain text paragraphs in JSON; Markdown parsing can be introduced when the writing archive needs richer formatting.

### Full articles, reviews and attachments

Projects, writeups, travel journals and library reviews support the same optional rich-content fields:

- `sections`: ordered objects with `heading`, `body`, optional `quote`, `bullets` (strings), and `photos`.
- `photos`: ordered objects with `image`, `alt` and optional `caption`. They open in a keyboard-accessible gallery.
- `sources`: objects with `title`, HTTPS `url` and optional `annotation`.

All body paragraphs and sections are rendered in full. A book's `body` and `sections` contain the owner's review. Published travel items require coordinates and `countryCode`; the map turns those countries green and connects each marker to its journal and photos. No countries are marked visited until approved travel entries exist.
