import { getNotifications } from '$lib/server/notifications';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('app:notifications');

	return {
		user: locals.user ? { name: locals.user.name, email: locals.user.email } : null,
		notifications: locals.user ? await getNotifications(locals.user.id) : null
	};
};
