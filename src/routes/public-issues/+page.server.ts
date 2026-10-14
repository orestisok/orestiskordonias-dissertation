import { redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, type ReportEvent } from '$lib/server/db/schema';
import { photoUrl } from '$lib/photos';
import { statusMeta } from '$lib/reports';
import { formatDate, timeAgo } from '$lib/time';
import type { PageServerLoad } from './$types';

function updateLabel(event: Pick<ReportEvent, 'type' | 'fromStatus' | 'toStatus'>) {
	switch (event.type) {
		case 'status_change':
			return event.fromStatus && event.toStatus
				? `Status changed to ${statusMeta[event.toStatus].label}`
				: 'Report submitted';
		case 'comment':
			return 'Staff update';
		case 'edit':
			return 'Reporter updated the report';
		case 'assignment':
			return 'Assigned to a crew';
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');

	const rows = await db.query.reports.findMany({
		where: (r, { ne }) => ne(r.status, 'rejected'),
		orderBy: (r, { desc }) => [desc(r.createdAt)],
		limit: 500,
		columns: {
			id: true,
			referenceNumber: true,
			title: true,
			description: true,
			status: true,
			address: true,
			location: true,
			createdAt: true,
			updatedAt: true
		},
		with: {
			category: { columns: { id: true, name: true } },
			photos: {
				columns: { objectKey: true },
				orderBy: (p, { asc }) => [asc(p.position)]
			},
			events: {
				columns: {
					id: true,
					type: true,
					fromStatus: true,
					toStatus: true,
					body: true,
					createdAt: true
				},
				where: (e, { eq }) => eq(e.isPublic, true),
				orderBy: (e, { desc }) => [desc(e.createdAt)]
			}
		}
	});

	return {
		categories: await db
			.select({ id: categories.id, name: categories.name })
			.from(categories)
			.where(eq(categories.isActive, true))
			.orderBy(asc(categories.id)),
		issues: rows.map((r) => ({
			id: r.id,
			reference: `RN-${r.referenceNumber}`,
			title: r.title,
			description: r.description,
			status: r.status,
			categoryId: r.category.id,
			category: r.category.name,
			address: r.address,
			lng: r.location.x,
			lat: r.location.y,
			createdAt: r.createdAt.getTime(),
			submittedOn: formatDate(r.createdAt),
			submittedAgo: timeAgo(r.createdAt),
			updatedAgo: timeAgo(r.updatedAt),
			photos: r.photos.map((p) => photoUrl(p.objectKey)),
			updates: r.events.map((e) => ({
				id: e.id,
				label: updateLabel(e),
				body: e.body,
				date: formatDate(e.createdAt)
			}))
		}))
	};
};
