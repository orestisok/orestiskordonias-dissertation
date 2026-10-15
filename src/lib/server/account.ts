import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';
import { deleteReportPhotos } from '$lib/server/storage';

export async function deleteUnreviewedReports(userId: string) {
	const unreviewed = await db
		.select({ id: reports.id })
		.from(reports)
		.where(and(eq(reports.reporterId, userId), eq(reports.status, 'submitted')));
	if (!unreviewed.length) return;

	const ids = unreviewed.map((report) => report.id);
	for (const id of ids) await deleteReportPhotos(id);
	await db.delete(reports).where(inArray(reports.id, ids));
}
