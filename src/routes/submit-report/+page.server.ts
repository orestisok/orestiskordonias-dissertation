import { fail, redirect } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, reportEvents, reportPhotos, reports } from '$lib/server/db/schema';
import { deleteReportPhotos, InvalidPhotoError, saveReportPhoto } from '$lib/server/storage';
import { MAX_PHOTOS, photoError } from '$lib/photos';
import type { Actions, PageServerLoad } from './$types';

const MAX_TITLE = 120;
const MIN_DESCRIPTION = 20;
const MAX_DESCRIPTION = 2000;
const MAX_ADDRESS = 255;

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

function coordinate(value: FormDataEntryValue | null, limit: number) {
	if (typeof value !== 'string' || value.trim() === '') return null;
	const n = Number(value);
	return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const address = String(data.get('address') ?? '').trim() || null;
		const categoryId = Number(data.get('categoryId'));
		const lng = coordinate(data.get('lng'), 180);
		const lat = coordinate(data.get('lat'), 90);
		const photos = data.getAll('photos').filter((p): p is File => p instanceof File && p.size > 0);

		if (!title || title.length > MAX_TITLE) {
			return fail(400, { message: `Enter a title of up to ${MAX_TITLE} characters.` });
		}
		if (description.length < MIN_DESCRIPTION || description.length > MAX_DESCRIPTION) {
			return fail(400, {
				message: `The description must be ${MIN_DESCRIPTION} to ${MAX_DESCRIPTION} characters.`
			});
		}
		if (address && address.length > MAX_ADDRESS) {
			return fail(400, { message: `The address must be at most ${MAX_ADDRESS} characters.` });
		}
		if (lng === null || lat === null) {
			return fail(400, { message: 'Choose a location on the map.' });
		}
		if (photos.length > MAX_PHOTOS) {
			return fail(400, { message: `You can attach up to ${MAX_PHOTOS} photos.` });
		}
		for (const photo of photos) {
			const message = photoError(photo);
			if (message) return fail(400, { message });
		}

		const [category] = Number.isInteger(categoryId)
			? await db
					.select({ id: categories.id })
					.from(categories)
					.where(and(eq(categories.id, categoryId), eq(categories.isActive, true)))
			: [];
		if (!category) return fail(400, { message: 'Select a valid issue category.' });

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
						categoryId: category.id,
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
