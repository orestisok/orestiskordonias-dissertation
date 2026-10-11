import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { photoUrl } from '$lib/photos';
import type { PageServerLoad } from './$types';

const units: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 86400],
	['month', 30 * 86400],
	['week', 7 * 86400],
	['day', 86400],
	['hour', 3600],
	['minute', 60]
];
const relative = new Intl.RelativeTimeFormat('en', { style: 'narrow' });

function timeAgo(date: Date) {
	const seconds = (Date.now() - date.getTime()) / 1000;
	const match = units.find(([, size]) => seconds >= size);
	return match ? relative.format(-Math.floor(seconds / match[1]), match[0]) : 'just now';
}

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
				where: (e, { and, eq, isNotNull }) => and(eq(e.isPublic, true), isNotNull(e.body)),
				orderBy: (e, { desc }) => [desc(e.createdAt)],
				limit: 1
			}
		}
	});

	return {
		reports: rows.map((r) => ({
			id: r.id,
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
