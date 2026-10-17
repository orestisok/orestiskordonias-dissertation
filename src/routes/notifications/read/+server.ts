import { error } from '@sveltejs/kit';
import { markNotificationsRead } from '$lib/server/notifications';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Sign in to manage notifications');

	await markNotificationsRead(locals.user.id);
	return new Response(null, { status: 204 });
};
