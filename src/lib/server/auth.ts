import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { resetPasswordEmail, sendEmail, verificationEmail } from '$lib/server/email';
import type { UserRole } from '$lib/server/db/schema';

export const MIN_PASSWORD_LENGTH = 8;

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		minPasswordLength: MIN_PASSWORD_LENGTH,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			sendEmail(resetPasswordEmail(user.email, user.name, url)).catch((error) =>
				console.error('Failed to send password reset email', error)
			);
		}
	},
	emailVerification: {
		sendOnSignUp: true,
		sendOnSignIn: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendEmail(verificationEmail(user.email, user.name, url));
		}
	},
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
