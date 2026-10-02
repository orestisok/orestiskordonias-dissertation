import type { auth } from '$lib/server/auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			// Inferred from our auth config, so user.role is typed
			user?: typeof auth.$Infer.Session.user;
			session?: typeof auth.$Infer.Session.session;
		}

		// interface Error {}
		// interface PageData {}
		interface PageState {
			step?: number;
		}
		// interface Platform {}
	}
}

export {};
