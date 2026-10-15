import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth, MIN_PASSWORD_LENGTH } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const token = url.searchParams.get('token');
	return { token: url.searchParams.has('error') ? null : token };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const token = String(data.get('token') ?? '');
		const password = String(data.get('password') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				message: `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`
			});
		}
		if (password !== confirmPassword) {
			return fail(400, { message: "The passwords don't match." });
		}

		try {
			await auth.api.resetPassword({
				body: { token, newPassword: password },
				headers: request.headers
			});
		} catch (error) {
			if (error instanceof APIError) return fail(400, { invalid: true });
			throw error;
		}

		return { done: true };
	}
};
