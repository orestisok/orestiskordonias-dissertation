import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { photoUrl } from '$lib/photos';
import { timeAgo } from '$lib/time';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	const reporterId = locals.user.id;

	const rows = await db.query.reports.findMany({
		where: (r, { eq }) => eq(r.reporterId, reporterId),
		orderBy: (r, { desc }) => [desc(r.updatedAt)],
		columns: {
			id: true,
			referenceNumber: true,
			title: true,
			status: true,
			address: true,
			updatedAt: true
		},
		with: {
			category: { columns: { name: true } },
			photos: {
				columns: { objectKey: true },
				orderBy: (p, { asc }) => [asc(p.position)],
				limit: 1
			},
			events: {
				columns: { body: true },
				where: (e, { and, eq, ne, isNotNull }) =>
					and(eq(e.isPublic, true), isNotNull(e.body), ne(e.type, 'edit')),
				orderBy: (e, { desc }) => [desc(e.createdAt)],
				limit: 1
			}
		}
	});

	return {
		reports: rows.map((r) => ({
			id: r.id,
			referenceNumber: r.referenceNumber,
			reference: `RN-${r.referenceNumber}`,
			title: r.title,
			status: r.status,
			category: r.category.name,
			address: r.address,
			updatedAgo: timeAgo(r.updatedAt),
			image: r.photos[0] ? photoUrl(r.photos[0].objectKey) : null,
			note: r.events[0]?.body ?? null
		}))
	};
};
