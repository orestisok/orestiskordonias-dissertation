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

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
