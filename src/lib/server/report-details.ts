import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import { MAX_ADDRESS, MAX_DESCRIPTION, MAX_TITLE, MIN_DESCRIPTION } from '$lib/reports';

export interface ReportDetails {
	title: string;
	description: string;
	address: string | null;
	categoryId: number;
	lng: number;
	lat: number;
}

function coordinate(value: FormDataEntryValue | null, limit: number) {
	if (typeof value !== 'string' || value.trim() === '') return null;
	const n = Number(value);
	return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

export async function parseReportDetails(
	data: FormData
): Promise<{ details: ReportDetails; message?: never } | { details?: never; message: string }> {
	const title = String(data.get('title') ?? '').trim();
	const description = String(data.get('description') ?? '').trim();
	const address = String(data.get('address') ?? '').trim() || null;
	const categoryId = Number(data.get('categoryId'));
	const lng = coordinate(data.get('lng'), 180);
	const lat = coordinate(data.get('lat'), 90);

	if (!title || title.length > MAX_TITLE) {
		return { message: `Enter a title of up to ${MAX_TITLE} characters.` };
	}
	if (description.length < MIN_DESCRIPTION || description.length > MAX_DESCRIPTION) {
		return {
			message: `The description must be ${MIN_DESCRIPTION} to ${MAX_DESCRIPTION} characters.`
		};
	}
	if (address && address.length > MAX_ADDRESS) {
		return { message: `The address must be at most ${MAX_ADDRESS} characters.` };
	}
	if (lng === null || lat === null) {
		return { message: 'Choose a location on the map.' };
	}

	const [category] = Number.isInteger(categoryId)
		? await db
				.select({ id: categories.id })
				.from(categories)
				.where(and(eq(categories.id, categoryId), eq(categories.isActive, true)))
		: [];
	if (!category) return { message: 'Select a valid issue category.' };

	return { details: { title, description, address, categoryId: category.id, lng, lat } };
}
