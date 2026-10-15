import { fail, redirect } from '@sveltejs/kit';
import { auth, homePathFor } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, homePathFor(locals.user.role));
};

export const actions: Actions = {
	default: async ({ request }) => {
		const email = String((await request.formData()).get('email') ?? '').trim();
		if (!email) return fail(400, { email, message: 'Enter your email address.' });

		await auth.api.requestPasswordReset({
			body: { email, redirectTo: '/reset-password' },
			headers: request.headers
		});
		return { sent: email };
	}
};
