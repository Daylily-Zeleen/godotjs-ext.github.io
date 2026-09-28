# GodotJS-Ext documentation site

Source of <https://daylily-zeleen.github.io/godotjs-ext.github.io/> (once GitHub Pages is enabled
for this repository).

Built with [VitePress](https://vitepress.dev/), but with a **custom theme**: the default theme's
`Layout` is replaced by `docs/.vitepress/theme/Layout.vue` (a persistent left rail, a narrow reading
column, an amber accent and a monospace header), and its stylesheet is never imported. Markdown still
goes through VitePress' pipeline.

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:5173/godotjs-ext.github.io/
```

```bash
pnpm build        # static output in docs/.vitepress/dist
pnpm preview      # serve the built output
pnpm check:i18n   # both locales must expose the same page set
```

## Content layout

Chinese is the **default locale** (served from `/`), English lives under `/en/`.

```
docs/
├─ .vitepress/
│  ├─ config.mts        site metadata, locales, base
│  ├─ data/nav.mts      navigation/sidebar, one entry carrying both languages
│  └─ theme/            custom theme (Layout, SearchBox, LocaleSwitch, HomeCards, style.css)
├─ public/              favicon and other static files
├─ <page>.md            Chinese (default locale)
└─ en/<page>.md         English
```

The two trees must stay **structurally identical**: VitePress does not fall back to the default
locale, so a missing translation is a 404, not a degraded page. `pnpm check:i18n` is the gate; it runs
in CI before the build.

Adding a page:

1. create `docs/<path>.md` and `docs/en/<path>.md`;
2. add one entry to `docs/.vitepress/data/nav.mts` (it carries both labels);
3. `pnpm check:i18n && pnpm build`.

## Base path

`base` defaults to `/godotjs-ext.github.io/` (GitHub project page). Override it with the `DOCS_BASE`
environment variable when moving to an organisation/user page or a custom domain - no source change
needed:

```bash
DOCS_BASE=/ pnpm build
```

## Deployment

`.github/workflows/deploy.yml` installs with pnpm, runs `check:i18n`, builds, and publishes the
artifact with `actions/deploy-pages`.

**One-time setup:** in this repository, open *Settings -> Pages* and set **Source** to
*GitHub Actions*. The workflow cannot enable Pages by itself.

## License

The site content documents GodotJS-Ext, which is licensed under GNU LGPL 2.1 (see `LICENSE`).
