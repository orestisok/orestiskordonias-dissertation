import { page } from '$app/state';
import type { RouteId } from '$app/types';

// Compare route ids rather than resolve() output, which is relative during SSR.
// Match sub-routes too, e.g. /my-reports/edit keeps "My Reports" active
export const isActive = (route: RouteId) =>
	page.route.id === route || !!page.route.id?.startsWith(`${route}/`);
