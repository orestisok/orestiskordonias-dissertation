import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import {
	auth,
	isStaffEmail,
	isWorker,
	MIN_PASSWORD_LENGTH,
	STAFF_EMAIL_DOMAIN
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

const MAX_NAME_LENGTH = 100;

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.user) redirect(303, '/login');

	const error = url.searchParams.get('error');
	let emailNotice: string | null = null;
	if (error) {
		emailNotice =
			error === 'token_expired'
				? 'That email change link has expired. Request the change again.'
				: "That email change link didn't work. Request the change again.";
	} else if (url.searchParams.get('email') === 'pending') {
		emailNotice = `Your email is ${locals.user.email}. If you just approved a change, check your new inbox for one more link to finish it.`;
	}

	return {
		name: locals.user.name,
		email: locals.user.email,
		isStaff: isWorker(locals.user.role),
		emailNotice,
		emailNoticeIsError: !!error
	};
};

const field = (data: FormData, key: string) => String(data.get(key) ?? '');

const isWrongPassword = (error: APIError) => error.body?.code === 'INVALID_PASSWORD';

export const actions: Actions = {
	name: async ({ request }) => {
		const name = field(await request.formData(), 'name').trim();
		if (!name || name.length > MAX_NAME_LENGTH) {
			return fail(400, {
				section: 'name',
				message: `Enter a name of up to ${MAX_NAME_LENGTH} characters.`
			});
		}

		await auth.api.updateUser({ body: { name }, headers: request.headers });
		return { section: 'name', success: 'Your name has been updated.' };
	},
	email: async ({ request, locals }) => {
		const newEmail = field(await request.formData(), 'email')
			.trim()
			.toLowerCase();
		if (!newEmail) {
			return fail(400, { section: 'email', message: 'Enter your new email address.' });
		}
		if (newEmail === locals.user?.email) {
			return fail(400, { section: 'email', message: "That's already your email address." });
		}
		if (locals.user && isWorker(locals.user.role) && !isStaffEmail(newEmail)) {
			return fail(400, {
				section: 'email',
				message: `Staff accounts must use an @${STAFF_EMAIL_DOMAIN} email address.`
			});
		}

		try {
			await auth.api.changeEmail({
				body: { newEmail, callbackURL: '/settings?email=pending' },
				headers: request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				const message =
					error.statusCode === 422
						? 'That email is already used by another account.'
						: "We couldn't start the email change. Check the address and try again.";
				return fail(400, { section: 'email', message });
			}
			throw error;
		}

		return {
			section: 'email',
			success: `We sent an approval link to ${locals.user?.email}. After you approve, we'll send a confirmation link to ${newEmail}.`
		};
	},
	password: async ({ request }) => {
		const data = await request.formData();
		const currentPassword = field(data, 'currentPassword');
		const newPassword = field(data, 'newPassword');
		const confirmPassword = field(data, 'confirmPassword');

		if (!currentPassword) {
			return fail(400, { section: 'password', message: 'Enter your current password.' });
		}
		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				section: 'password',
				message: `Your new password needs at least ${MIN_PASSWORD_LENGTH} characters.`
			});
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { section: 'password', message: "The new passwords don't match." });
		}

		try {
			await auth.api.changePassword({
				body: { currentPassword, newPassword, revokeOtherSessions: true },
				headers: request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				const message = isWrongPassword(error)
					? 'Your current password is incorrect.'
					: error.message;
				return fail(400, { section: 'password', message });
			}
			throw error;
		}

		return {
			section: 'password',
			success: "Your password has been changed. You've been signed out on your other devices."
		};
	},
	delete: async ({ request }) => {
		const password = field(await request.formData(), 'password');
		if (!password) {
			return fail(400, { section: 'delete', message: 'Enter your password to confirm.' });
		}

		try {
			await auth.api.deleteUser({ body: { password }, headers: request.headers });
		} catch (error) {
			if (error instanceof APIError) {
				const message = isWrongPassword(error) ? 'Your password is incorrect.' : error.message;
				return fail(400, { section: 'delete', message });
			}
			throw error;
		}

		redirect(303, '/');
	}
};
