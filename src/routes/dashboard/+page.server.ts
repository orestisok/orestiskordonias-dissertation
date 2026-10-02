import { redirect } from '@sveltejs/kit';
import { homePathFor } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

// Staff only: logged-out users go to /login, citizens to their own home page
export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	if (locals.user.role !== 'staff') redirect(303, homePathFor(locals.user.role));
	return { name: locals.user.name };
};
