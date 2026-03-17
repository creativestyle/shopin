# @integrations/contentful-migration

Content model and demo content for the SHOPin storefront starter, applied via [Contentful migrations](https://contentful.com/developers/docs/tutorials/cli/scripting-migrations/) (CMS-as-code). Defines content types (Page, teasers, layout, etc.) and optional seed data; run against your Contentful space so the BFF and `@integrations/contentful-api` can serve pages and layout.

## Prerequisites

- [Contentful CLI](https://contentful.com/developers/docs/tutorials/cli/installation/) (installed via this package)
- A Contentful space and a **Management API** token (Personal access token, not Delivery/Preview)

## Environment

Set in **repo root `.env`** (see [.env.example](../../.env.example) for all descriptions):

- `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN` – Management API (Personal access token), not Delivery/Preview
- `CONTENTFUL_SPACE` – Space ID
- `CONTENTFUL_ENVIRONMENT` – e.g. `master`

**How to get the Management API token (Personal access token)**

1. Log in to [app.contentful.com](https://app.contentful.com).
2. Click your **profile picture** (top right).
3. Choose **Personal access tokens** from the dropdown.
4. Click **Generate personal access token**, give it a name (e.g. “Migrations”), and copy the token.
5. Put it in `.env` as `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN`.

The token is shown only once; if you lose it, create a new one. Use a **Personal access token** (Management API), not the Content delivery / Preview API key from Space settings → API keys.

**Space ID and environment:** In the app, open your space → **Settings** → **General settings** for the Space ID. The default environment is usually `master` (Settings → Environments).

## Commands

**Recommended:** run migration commands from the **package level** — either from the **repo root** or from this package directory. This ensures env (root `.env`) and paths resolve correctly. The `migrate` script builds and runs the migration CLI; pass the **subcommand** after `--` (the `--` is required so npm forwards arguments). **From repo root:** `npm run migrate -w @integrations/contentful-migration --`. **From this package:** `npm run migrate --`.

```bash
# Run all migrations (default; same as passing "migrate")
npm run migrate --

# Interactive: same as migrate but prompts for confirmation before applying
npm run migrate -- migrate:interactive

# Destructive: delete all entries and content types (00-00-* only)
npm run migrate -- reset

# Schema only: content types 01-01-01 … 01-03-02
npm run migrate -- migrate:content-types

# Seed only: demo content 02-01-01 … 02-01-05; run after content-types
npm run migrate -- migrate:demo
```

**Options**

- `--from <number>` – Start from a given migration sort key (skips earlier ones). Sort key = `GG*10000 + SS*100 + NN` (e.g. `npm run migrate -- migrate --from 10301`). Use this to **resume after a failure** without resetting: if e.g. 01-01-04 failed, run `npm run migrate -- --from 10104` to continue from accordion-item.
- `--list` – **Preview** which migrations would run for that command, without executing. No env needed. Example: `npm run migrate -- migrate --list` or `npm run migrate -- migrate:content-types --list`.
- **List all migrations:** `npm run migrate -- list` — prints every migration file in order (no env needed).
- `--help` – Show all commands: `npm run migrate -- --help` or `npm run migrate -- help`. Per-command help: `npm run migrate -- migrate --help`.

## Layout

- **migrations/lib/** – Shared code (api, apply, content-types/ids, demo, page-teasers). Not run as migrations.
- **migrations/01-01-common/** – Page (01-01-01), Link (01-01-02, with Linked page), Button, Accordion item, Accordion, Rich text (01-01-03 … 01-01-06).
- **migrations/01-02-teasers/** – Teaser content types (01-02-01 … 01-02-13).
- **migrations/01-03-sections/** – Top Bar, Footer (01-03-01 … 01-03-02).
- **migrations/02-01-demo-content/** – Seed data: 02-01-01 homepage, 02-01-02 about, 02-01-03 support, 02-01-04 top bar, 02-01-05 footer (layout after pages so footer can link to About/Support). Non-migration modules: **homepage/** (constants, link/button/teaser helpers), **shared/** (e.g. rich-text.ts – data used by homepage and about; runner skips it – only runs GG-SS-NN-name.js).

Filenames: **`GG-SS-NN-name.ts`** (source; built to `.js`). Dirs follow **`GG-SS-description`**. Runner sorts by (GG, SS, NN) and skips `lib/`. New migration = new file with next free triple in the right dir.

**New teaser:** Add `01-02-teasers/01-02-NN-name.ts` (NN 01–13), export the migration function (`export = run`).

**Preview in Contentful:** Settings → Content preview → Page → Preview URL e.g. `https://your-app.com/{locale}/{entry.fields.slug}?preview=true`

**German (de-DE) content:** En-US and de-DE texts are defined **side by side** in the same demo migrations (02-01-01 … 02-01-05); entries are created with both locales in one go. Ensure the Contentful space has the **de-DE** locale (Settings → Locales) before running demo migrations.

Details: `migrations/lib/README.md`.

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
