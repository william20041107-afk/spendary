# Spendary

Spendary is a mobile-first spending diary. Each expense becomes a dot on a daily map. Records are saved in this browser with `localStorage`.

## Local development

Requires Node.js 22 and pnpm 11.

```sh
pnpm install
pnpm dev
```

## Checks

```sh
pnpm lint
pnpm build
```

Pushes to `main` build and deploy the app to GitHub Pages through [the Pages workflow](.github/workflows/deploy.yml). The production base path is `/spendary/`.
