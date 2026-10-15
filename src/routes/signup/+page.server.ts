import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth, homePathFor, MIN_PASSWORD_LENGTH } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, homePathFor(locals.user.role));
};

export const actions: Actions = {
	signup: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (!name || !email || !password) {
			return fail(400, { name, email, message: 'Fill in your name, email and password.' });
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				name,
				email,
				message: `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`
			});
		}
		if (password !== confirmPassword) {
			return fail(400, { name, email, message: "The passwords don't match." });
		}

		try {
			await auth.api.signUpEmail({
				body: { name, email, password, callbackURL: '/login' },
				headers: request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				const message =
					error.statusCode === 422
						? 'An account with this email already exists. Try logging in.'
						: error.message;
				return fail(400, { name, email, message });
			}
			throw error;
		}

		return { sent: email };
	},
	resend: async ({ request }) => {
		const email = String((await request.formData()).get('email') ?? '').trim();
		if (!email) return fail(400, { message: 'Missing email address.' });

		await auth.api.sendVerificationEmail({
			body: { email, callbackURL: '/login' },
			headers: request.headers
		});
		return { sent: email, resent: true };
	}
};
