import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { APIError } from 'better-auth/api';
import { deleteUnreviewedReports } from '$lib/server/account';
import {
	changeEmailConfirmationEmail,
	newEmailVerificationEmail,
	resetPasswordEmail,
	sendEmail,
	verificationEmail
} from '$lib/server/email';
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
			const email = user.emailVerified ? newEmailVerificationEmail : verificationEmail;
			await sendEmail(email(user.email, user.name, url));
		}
	},
	user: {
		additionalFields: {
			// input: false so users can't make themselves staff on signup
			role: {
				type: ['citizen', 'staff', 'admin'],
				required: true,
				defaultValue: 'citizen',
				input: false
			}
		},
		changeEmail: {
			enabled: true,
			sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
				await sendEmail(changeEmailConfirmationEmail(user.email, user.name, newEmail, url));
			}
		},
		deleteUser: {
			enabled: true,
			beforeDelete: async (user) => {
				if ('role' in user && (user.role === 'staff' || user.role === 'admin')) {
					throw new APIError('FORBIDDEN', { message: "Staff accounts can't be deleted here." });
				}
				await deleteUnreviewedReports(user.id);
			}
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});

// Where each role lands after logging in.
export const STAFF_EMAIL_DOMAIN = 'thessaloniki.gr';

export function isWorker(role: UserRole) {
	return role === 'staff' || role === 'admin';
}

export function isStaffEmail(email: string) {
	return /^[^@\s]+@thessaloniki\.gr$/.test(email);
}

export function homePathFor(role: UserRole) {
	return isWorker(role) ? '/dashboard' : '/my-reports';
}

export function requireStaff(locals: App.Locals) {
	if (!locals.user) redirect(303, '/login');
	if (!isWorker(locals.user.role)) redirect(303, homePathFor(locals.user.role));
	return locals.user;
}

export function requireAdmin(locals: App.Locals) {
	if (!locals.user) redirect(303, '/login');
	if (locals.user.role !== 'admin') redirect(303, homePathFor(locals.user.role));
	return locals.user;
}
