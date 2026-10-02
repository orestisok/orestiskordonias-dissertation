import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import type { UserRole } from '$lib/server/db/schema';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true },
	user: {
		additionalFields: {
			// input: false so users can't make themselves staff on signup
			role: { type: ['citizen', 'staff'], required: true, defaultValue: 'citizen', input: false }
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});

// Where each role lands after logging in. /dashboard is a placeholder for now.
export function homePathFor(role: UserRole) {
	return role === 'staff' ? '/dashboard' : '/my-reports';
}
