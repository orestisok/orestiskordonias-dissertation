import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth, homePathFor } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, homePathFor(locals.user.role));
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const rememberMe = data.get('remember') === 'on';

		if (!email || !password) {
			return fail(400, { email, message: 'Enter your email and password.' });
		}

		let role;
		try {
			// sveltekitCookies sets the session cookie on this response
			const result = await auth.api.signInEmail({
				body: { email, password, rememberMe },
				headers: request.headers
			});
			role = result.user.role;
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { email, message: 'Invalid email or password.' });
			}
			throw error;
		}

		redirect(303, homePathFor(role));
	}
};
