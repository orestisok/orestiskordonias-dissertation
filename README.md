# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.16.1 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:none" better-auth="demo:password" drizzle="database:postgresql+postgresql:postgres.js+docker:yes" --install npm svelte-test-test
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Admin accounts

Admins sign in at `/login` like everyone else and get a **Management** page in the dashboard, where they create, re-password and delete municipal staff accounts (`@thessaloniki.gr` emails only).

Create the first admin, or promote an existing account, against the database in `DATABASE_URL`:

```sh
npm run admin:create -- --email name@thessaloniki.gr --name "Full Name"
```

The script asks for the password interactively. Pass `--yes` to write to a non-local database. Locally, `npm run db:seed` also creates `admin@example.com` with `SEED_ADMIN_PASSWORD`.

## Installing as an app

CivicScan is a progressive web app: browsers offer to install it from the address bar (Chrome, Edge) or via **Add to Home Screen** (iOS Safari, Android). Installation needs HTTPS in production; `localhost` is exempt. To test installation and offline behaviour locally, use the production build: `npm run build && npm run preview`.

The service worker (`src/service-worker.ts`) caches the built JS/CSS and `static/` files. Pages and data always come from the network, and `static/offline.html` is shown when there is no connection.

The icons in `static/icons/` are generated from `src/lib/assets/favicon.svg`. To regenerate them after changing the logo:

```sh
S=src/lib/assets/favicon.svg
rsvg-convert -h 154 $S | magick - -background none -gravity center -extent 192x192 static/icons/icon-192.png
rsvg-convert -h 410 $S | magick - -background none -gravity center -extent 512x512 static/icons/icon-512.png
rsvg-convert -h 307 $S | magick - -background white -gravity center -extent 512x512 -alpha remove static/icons/icon-maskable-512.png
rsvg-convert -h 135 $S | magick - -background white -gravity center -extent 180x180 -alpha remove static/icons/apple-touch-icon.png
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
