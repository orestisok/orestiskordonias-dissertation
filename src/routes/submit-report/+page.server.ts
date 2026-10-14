import { fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, reportEvents, reportPhotos, reports } from '$lib/server/db/schema';
import { parseReportDetails } from '$lib/server/report-details';
import { deleteReportPhotos, InvalidPhotoError, saveReportPhoto } from '$lib/server/storage';
import { MAX_PHOTOS, photoError } from '$lib/photos';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');

	return {
		categories: await db
			.select({ id: categories.id, name: categories.name })
			.from(categories)
			.where(eq(categories.isActive, true))
			.orderBy(asc(categories.id))
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');

		const data = await request.formData();
		const parsed = await parseReportDetails(data);
		if (parsed.message !== undefined) return fail(400, { message: parsed.message });
		const { title, description, address, categoryId, lng, lat } = parsed.details;

		const photos = data.getAll('photos').filter((p): p is File => p instanceof File && p.size > 0);
		if (photos.length > MAX_PHOTOS) {
			return fail(400, { message: `You can attach up to ${MAX_PHOTOS} photos.` });
		}
		for (const photo of photos) {
			const message = photoError(photo);
			if (message) return fail(400, { message });
		}

		const reporterId = locals.user.id;
		let reportId: string | undefined;
		try {
			await db.transaction(async (tx) => {
				const [report] = await tx
					.insert(reports)
					.values({
						title,
						description,
						address,
						location: { x: lng, y: lat },
						categoryId,
						reporterId
					})
					.returning({ id: reports.id });
				reportId = report.id;

				await tx.insert(reportEvents).values({
					reportId: report.id,
					actorId: reporterId,
					type: 'status_change',
					toStatus: 'submitted',
					isPublic: true
				});

				for (const [position, photo] of photos.entries()) {
					const objectKey = await saveReportPhoto(report.id, photo);
					await tx.insert(reportPhotos).values({ reportId: report.id, objectKey, position });
				}
			});
		} catch (error) {
			if (reportId) await deleteReportPhotos(reportId);
			if (error instanceof InvalidPhotoError) return fail(400, { message: error.message });
			throw error;
		}

		redirect(303, '/my-reports');
	}
};
