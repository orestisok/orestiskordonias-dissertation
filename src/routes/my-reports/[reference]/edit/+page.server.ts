import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, reportEvents, reports } from '$lib/server/db/schema';
import { parseReportDetails } from '$lib/server/report-details';
import { photoUrl } from '$lib/photos';
import type { Actions, PageServerLoad } from './$types';

function findOwnReport(reference: string, reporterId: string) {
	const referenceNumber = Number(reference);
	if (!Number.isInteger(referenceNumber)) return undefined;

	return db.query.reports.findFirst({
		where: (r, { and, eq }) =>
			and(eq(r.referenceNumber, referenceNumber), eq(r.reporterId, reporterId)),
		columns: {
			id: true,
			referenceNumber: true,
			title: true,
			description: true,
			address: true,
			location: true,
			status: true,
			categoryId: true
		},
		with: {
			photos: {
				columns: { objectKey: true },
				orderBy: (p, { asc }) => [asc(p.position)]
			}
		}
	});
}

function listOf(items: string[]) {
	return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items[0];
}

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(303, '/login');

	const report = await findOwnReport(params.reference, locals.user.id);
	if (!report) error(404, 'Report not found');
	if (report.status !== 'submitted') redirect(303, '/my-reports');

	return {
		categories: await db
			.select({ id: categories.id, name: categories.name })
			.from(categories)
			.where(eq(categories.isActive, true))
			.orderBy(asc(categories.id)),
		report: {
			reference: `RN-${report.referenceNumber}`,
			title: report.title,
			categoryId: report.categoryId,
			description: report.description,
			address: report.address ?? '',
			lng: report.location.x,
			lat: report.location.y,
			status: report.status,
			photos: report.photos.map((p) => photoUrl(p.objectKey))
		}
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		if (!locals.user) redirect(303, '/login');
		const reporterId = locals.user.id;

		const report = await findOwnReport(params.reference, reporterId);
		if (!report) error(404, 'Report not found');
		if (report.status !== 'submitted') {
			return fail(409, { message: 'This report can no longer be edited.' });
		}

		const parsed = await parseReportDetails(await request.formData());
		if (parsed.message !== undefined) return fail(400, { message: parsed.message });
		const details = parsed.details;

		const changed = [
			details.title !== report.title && 'title',
			details.categoryId !== report.categoryId && 'category',
			details.description !== report.description && 'description',
			(details.lng !== report.location.x || details.lat !== report.location.y) && 'location',
			details.address !== report.address && 'address'
		].filter((field): field is string => typeof field === 'string');
		if (!changed.length) redirect(303, '/my-reports');

		const saved = await db.transaction(async (tx) => {
			const rows = await tx
				.update(reports)
				.set({
					title: details.title,
					categoryId: details.categoryId,
					description: details.description,
					address: details.address,
					location: { x: details.lng, y: details.lat }
				})
				.where(
					and(
						eq(reports.id, report.id),
						eq(reports.reporterId, reporterId),
						eq(reports.status, 'submitted')
					)
				)
				.returning({ id: reports.id });
			if (!rows.length) return false;

			await tx.insert(reportEvents).values({
				reportId: report.id,
				actorId: reporterId,
				type: 'edit',
				isPublic: true,
				body: `Updated ${listOf(changed)}.`
			});
			return true;
		});
		if (!saved) return fail(409, { message: 'This report can no longer be edited.' });

		redirect(303, '/my-reports');
	}
};
